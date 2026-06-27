import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight, dependency-free hardening for the public sim API routes
 * (/api/tts, /api/chat). These proxy to OpenAI on our key, so they must
 * not be freely abusable. The web service is a single long-running Node
 * process on Railway, so an in-memory rate limiter is effective.
 */

// ── In-memory fixed-window rate limiter (per IP + bucket) ──
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Returns true if the caller is within the limit, false if it should be blocked. */
export function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Opportunistic cleanup so the Map can't grow unbounded.
function sweep() {
  const now = Date.now();
  for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
}

/**
 * Rejects requests that aren't same-origin (no Origin/Referer matching our
 * host). Browsers always send Origin on POST; curl/cross-site callers don't.
 * Referer can be spoofed, so this is a cheap barrier, not a complete defense —
 * it's meant to be combined with the rate limiter.
 */
export function sameOrigin(req: NextRequest): boolean {
  const host = req.headers.get('host');
  if (!host) return false;
  const allowed = new Set([host]);

  const candidate = req.headers.get('origin') || req.headers.get('referer');
  if (!candidate) return false; // no Origin and no Referer → not a browser same-origin call
  try {
    const h = new URL(candidate).host;
    if (allowed.has(h)) return true;
    // Allow localhost dev across ports
    if (/^localhost(:\d+)?$/.test(h) || /^127\.0\.0\.1(:\d+)?$/.test(h)) return true;
    return false;
  } catch {
    return false;
  }
}

export interface GuardOptions {
  /** Max requests per minute per IP for this route. */
  maxPerMinute: number;
  /** Rate-limit bucket name (keeps routes independent). */
  bucket: string;
}

/**
 * Runs origin + rate-limit checks. Returns a NextResponse to short-circuit
 * with, or null if the request is allowed to proceed.
 */
export function guard(req: NextRequest, opts: GuardOptions): NextResponse | null {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  sweep();
  const ip = getClientIp(req);
  if (!rateLimit(`${opts.bucket}:${ip}`, opts.maxPerMinute)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }
  return null;
}
