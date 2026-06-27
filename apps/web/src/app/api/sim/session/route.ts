import { NextRequest, NextResponse } from 'next/server';
import { guard, issueSession } from '@/lib/api-guard';

// Issues a short-lived signed session token for the sim. Origin-checked and
// rate-limited so tokens can't be farmed; each token carries its own budget.
export async function POST(req: NextRequest) {
  const blocked = guard(req, { bucket: 'session', maxPerMinute: 6 });
  if (blocked) return blocked;

  const session = issueSession(req);
  if (!session) {
    return NextResponse.json({ error: 'server not configured' }, { status: 503 });
  }
  return NextResponse.json(session);
}
