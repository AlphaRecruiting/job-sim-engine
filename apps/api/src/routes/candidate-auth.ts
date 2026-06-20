import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const router = Router();
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const SECRET = process.env.JWT_SECRET as string;

// Simple in-memory rate limiter: 10 requests per 15 minutes per IP
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const authAttempts = new Map<string, { count: number; windowStart: number }>();

function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = authAttempts.get(ip);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    authAttempts.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }
  entry.count++;
  next();
}

function candidateToken(id: string, email: string) {
  return jwt.sign({ candidateProfileId: id, email, type: 'candidate' }, SECRET, { expiresIn: '24h' });
}

export function requireCandidateAuth(req: any, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(auth.slice(7), SECRET) as any;
    if (payload.type !== 'candidate') { res.status(401).json({ error: 'Not a candidate token' }); return; }
    req.candidateProfileId = payload.candidateProfileId;
    req.candidateEmail = payload.email;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

router.post('/register', authRateLimiter, async (req, res) => {
  const { email, password, name, phone } = req.body ?? {};
  if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return; }
  if (password.length < 8) { res.status(400).json({ error: 'Password must be at least 8 characters' }); return; }

  const existing = await prisma.candidateProfile.findUnique({ where: { email } });
  if (existing) { res.status(409).json({ error: 'An account with this email already exists' }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const profile = await prisma.candidateProfile.create({
    data: { email, passwordHash, name: name || email.split('@')[0], phone },
  });

  res.status(201).json({ token: candidateToken(profile.id, profile.email), profile: safeProfile(profile) });
});

router.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return; }

  const profile = await prisma.candidateProfile.findUnique({ where: { email } });
  if (!profile) { res.status(401).json({ error: 'Invalid email or password' }); return; }

  const valid = await bcrypt.compare(password, profile.passwordHash);
  if (!valid) { res.status(401).json({ error: 'Invalid email or password' }); return; }

  res.json({ token: candidateToken(profile.id, profile.email), profile: safeProfile(profile) });
});

router.get('/me', requireCandidateAuth, async (req: any, res) => {
  const profile = await prisma.candidateProfile.findUnique({ where: { id: req.candidateProfileId } });
  if (!profile) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(safeProfile(profile));
});

router.patch('/profile', requireCandidateAuth, async (req: any, res) => {
  const { name, phone, bio, location, linkedinUrl } = req.body;
  const profile = await prisma.candidateProfile.update({
    where: { id: req.candidateProfileId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
    },
  });
  res.json(safeProfile(profile));
});

router.post('/avatar', requireCandidateAuth, async (req: any, res) => {
  const { data } = req.body; // base64 data URI: "data:image/jpeg;base64,..."
  if (!data || typeof data !== 'string') { res.status(400).json({ error: 'Invalid data' }); return; }
  if (!data.startsWith('data:image/')) { res.status(400).json({ error: 'File must be an image' }); return; }
  const avatarBase64 = data.split(',')[1] ?? '';
  if (Math.ceil((avatarBase64.length * 3) / 4) > 5 * 1024 * 1024) { res.status(400).json({ error: 'Image must be under 5MB' }); return; }
  const profile = await prisma.candidateProfile.update({
    where: { id: req.candidateProfileId },
    data: { avatarData: data },
  });
  res.json({ avatarData: profile.avatarData });
});

router.post('/cv', requireCandidateAuth, async (req: any, res) => {
  const { data, filename } = req.body; // base64 PDF
  if (!data || typeof data !== 'string') { res.status(400).json({ error: 'Invalid data' }); return; }
  if (!data.startsWith('data:application/pdf') && !data.startsWith('data:application/octet-stream')) { res.status(400).json({ error: 'File must be a PDF' }); return; }
  const cvBase64 = data.split(',')[1] ?? '';
  if (Math.ceil((cvBase64.length * 3) / 4) > 10 * 1024 * 1024) { res.status(400).json({ error: 'CV must be under 10MB' }); return; }
  await prisma.candidateProfile.update({
    where: { id: req.candidateProfileId },
    data: { cvData: data, cvFilename: filename ?? 'cv.pdf' },
  });
  res.json({ success: true, filename: filename ?? 'cv.pdf' });
});

router.get('/cv', requireCandidateAuth, async (req: any, res) => {
  const profile = await prisma.candidateProfile.findUnique({ where: { id: req.candidateProfileId } });
  if (!profile?.cvData) { res.status(404).json({ error: 'No CV uploaded' }); return; }
  const buf = Buffer.from(profile.cvData.replace(/^data:[^;]+;base64,/, ''), 'base64');
  res.setHeader('Content-Type', 'application/pdf');
  const rawFilename = profile.cvFilename ?? 'cv.pdf';
  const safeFilename = rawFilename.replace(/[^\w.\-]/g, '_').slice(0, 200) || 'cv.pdf';
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.send(buf);
});

router.get('/applications', requireCandidateAuth, async (req: any, res) => {
  // CandidateProfile and Candidate are linked only by email
  const profile = await prisma.candidateProfile.findUnique({ where: { id: req.candidateProfileId } });
  if (!profile) { res.status(404).json({ error: 'Not found' }); return; }

  const candidates = await prisma.candidate.findMany({ where: { email: profile.email } });
  if (candidates.length === 0) { res.json([]); return; }

  const candidateIds = candidates.map(c => c.id);
  const applications = await prisma.application.findMany({
    where: { candidateId: { in: candidateIds } },
    include: {
      jobPosting: { select: { id: true, title: true, department: true, location: true, remotePolicy: true, employmentType: true } },
      simulationSessions: {
        select: { id: true, status: true, completedAt: true, currentStepId: true },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
      candidateResults: { select: { totalScore: true, recommendation: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(applications.map(app => ({
    id: app.id,
    status: app.status,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    jobPosting: app.jobPosting,
    session: app.simulationSessions[0] ?? null,
    result: app.candidateResults[0] ?? null,
  })));
});

function safeProfile(p: any) {
  const { passwordHash, cvData, ...rest } = p;
  return { ...rest, hasCv: !!cvData };
}

export default router;
