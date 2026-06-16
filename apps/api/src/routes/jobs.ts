import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CreateJobSchema } from '@job-sim/shared';
import { aiRecommendationQueue } from '../lib/queues';
import { v4 as uuid } from 'uuid';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const jobs = await prisma.jobPosting.findMany({
    where: { organizationId: req.organizationId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(jobs);
});

router.post('/', validate(CreateJobSchema), async (req: AuthRequest, res) => {
  const job = await prisma.jobPosting.create({
    data: { ...req.body, organizationId: req.organizationId!, createdByUserId: req.userId! },
  });
  res.status(201).json(job);
});

router.get('/:jobId', async (req: AuthRequest, res) => {
  const job = await prisma.jobPosting.findFirst({ where: { id: req.params.jobId, organizationId: req.organizationId } });
  if (!job) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(job);
});

router.patch('/:jobId', async (req: AuthRequest, res) => {
  const job = await prisma.jobPosting.updateMany({ where: { id: req.params.jobId, organizationId: req.organizationId }, data: req.body });
  res.json(job);
});

router.delete('/:jobId', async (req: AuthRequest, res) => {
  await prisma.jobPosting.updateMany({ where: { id: req.params.jobId, organizationId: req.organizationId }, data: { status: 'archived' } });
  res.json({ success: true });
});

router.post('/:jobId/publish', async (req: AuthRequest, res) => {
  const job = await prisma.jobPosting.updateMany({ where: { id: req.params.jobId, organizationId: req.organizationId }, data: { status: 'published' } });
  res.json(job);
});

router.post('/:jobId/archive', async (req: AuthRequest, res) => {
  await prisma.jobPosting.updateMany({ where: { id: req.params.jobId, organizationId: req.organizationId }, data: { status: 'archived' } });
  res.json({ success: true });
});

// AI recommendation
router.post('/:jobId/recommend-simulation', async (req: AuthRequest, res) => {
  const job = await prisma.jobPosting.findFirst({ where: { id: req.params.jobId, organizationId: req.organizationId } });
  if (!job) { res.status(404).json({ error: 'Job not found' }); return; }

  const run = await prisma.aiRecommendationRun.create({
    data: {
      organizationId: req.organizationId!,
      jobPostingId: job.id,
      createdByUserId: req.userId!,
      inputJobPost: { title: job.title, description: job.description, department: job.department, seniority: job.seniority },
      status: 'queued',
    },
  });

  await aiRecommendationQueue.add('generateSimulationRecommendation', { runId: run.id, organizationId: req.organizationId });
  res.status(202).json(run);
});

// Candidate management under job
router.post('/:jobId/candidates/invite', async (req: AuthRequest, res) => {
  const { email, name } = req.body;
  const job = await prisma.jobPosting.findFirst({ where: { id: req.params.jobId, organizationId: req.organizationId } });
  if (!job) { res.status(404).json({ error: 'Not found' }); return; }

  let candidate = await prisma.candidate.findFirst({ where: { organizationId: req.organizationId!, email } });
  if (!candidate) {
    candidate = await prisma.candidate.create({ data: { organizationId: req.organizationId!, email, name } });
  }

  const application = await prisma.application.create({
    data: {
      organizationId: req.organizationId!,
      jobPostingId: job.id,
      candidateId: candidate.id,
      status: 'invited',
      invitedAt: new Date(),
    },
  });

  res.status(201).json({ application, candidate });
});

router.get('/:jobId/candidates', async (req: AuthRequest, res) => {
  const applications = await prisma.application.findMany({
    where: { jobPostingId: req.params.jobId, organizationId: req.organizationId },
    include: { candidate: true, simulationSessions: { include: { candidateResult: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(applications);
});

// Analytics
router.get('/:jobId/analytics', async (req: AuthRequest, res) => {
  const [applications, results] = await Promise.all([
    prisma.application.count({ where: { jobPostingId: req.params.jobId, organizationId: req.organizationId } }),
    prisma.candidateResult.findMany({ where: { jobPostingId: req.params.jobId, organizationId: req.organizationId } }),
  ]);
  const scores = results.map(r => r.totalScore).filter((s): s is number => s !== null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  res.json({ totalApplications: applications, completedResults: results.length, averageScore: avg, results });
});

router.get('/:jobId/export.csv', async (req: AuthRequest, res) => {
  const results = await prisma.candidateResult.findMany({
    where: { jobPostingId: req.params.jobId, organizationId: req.organizationId },
    include: { candidate: true },
  });
  const csv = ['email,name,score,recommendation', ...results.map(r => `${r.candidate.email},${r.candidate.name ?? ''},${r.totalScore ?? ''},${r.recommendation ?? ''}`)].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="results.csv"`);
  res.send(csv);
});

export default router;
