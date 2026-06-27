import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

// ── Signed sim session tokens ──────────────────────────────────────────────
// Expensive routes require a short-lived, IP-bound, HMAC-signed token issued
// by /api/sim/session. Forging one needs SIM_SESSION_SECRET; each token also
// carries an in-memory per-session budget so a single token can't be abused.

const SESSION_TTL_MS = 45 * 60_000; // 45 minutes
const SESSION_BUDGET = { tts: 80, chat: 60 } as const;
type BudgetKind = keyof typeof SESSION_BUDGET;

const sessionBudgets = new Map<string, { tts: number; chat: number; exp: number }>();

function secret(): string {
  return process.env.SIM_SESSION_SECRET || '';
}

const b64url = (b: Buffer) => b.toString('base64url');

function sign(payload: string): string {
  return b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
}

/** Issues a new session token bound to the caller IP and seeds its budget. */
export function issueSession(req: NextRequest): { token: string; exp: number } | null {
  if (!secret()) return null; // misconfigured → caller returns 503
  const jti = b64url(crypto.randomBytes(16));
  const ip = getClientIp(req);
  const exp = Date.now() + SESSION_TTL_MS;
  const payloadJson = JSON.stringify({ jti, ip, exp });
  const payload = b64url(Buffer.from(payloadJson));
  const token = `${payload}.${sign(payload)}`;
  sessionBudgets.set(jti, { tts: SESSION_BUDGET.tts, chat: SESSION_BUDGET.chat, exp });
  return { token, exp };
}

function sweepSessions() {
  const now = Date.now();
  for (const [k, v] of sessionBudgets) if (now > v.exp) sessionBudgets.delete(k);
}

/**
 * Verifies the session token from the request and decrements its budget for
 * the given kind. Returns null on success, or a NextResponse to short-circuit.
 */
export function requireSession(req: NextRequest, kind: BudgetKind): NextResponse | null {
  if (!secret()) {
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }
  const raw =
    req.headers.get('x-sim-token') ||
    (req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '');
  if (!raw || !raw.includes('.')) {
    return NextResponse.json({ error: 'session required' }, { status: 401 });
  }

  const [payload, sig] = raw.split('.', 2);
  const expectedSig = sign(payload!);
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 401 });
  }

  let data: { jti?: string; ip?: string; exp?: number };
  try {
    data = JSON.parse(Buffer.from(payload!, 'base64url').toString());
  } catch {
    return NextResponse.json({ error: 'invalid session' }, { status: 401 });
  }

  if (!data.jti || !data.exp || Date.now() > data.exp) {
    return NextResponse.json({ error: 'session expired' }, { status: 401 });
  }
  if (data.ip && data.ip !== getClientIp(req)) {
    return NextResponse.json({ error: 'session ip mismatch' }, { status: 401 });
  }

  sweepSessions();
  const budget = sessionBudgets.get(data.jti);
  if (!budget) {
    // Unknown jti (server restarted or token never issued here) → force refresh.
    return NextResponse.json({ error: 'session expired' }, { status: 401 });
  }
  if (budget[kind] <= 0) {
    return NextResponse.json({ error: 'session budget exhausted' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }
  budget[kind]--;
  return null;
}
