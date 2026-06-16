import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { scoringQueue } from '../lib/queues';

const router = Router();
router.use(requireAuth);

router.get('/sessions/:sessionId/result', async (req: AuthRequest, res) => {
  const result = await prisma.candidateResult.findFirst({
    where: { sessionId: req.params.sessionId, organizationId: req.organizationId },
    include: { candidate: true, manualReviews: { include: { reviewer: true } } },
  });
  if (!result) { res.status(404).json({ error: 'Not found' }); return; }

  const submissions = await prisma.stepSubmission.findMany({ where: { sessionId: req.params.sessionId } });
  const events = await prisma.simulationEvent.findMany({ where: { sessionId: req.params.sessionId }, orderBy: { createdAt: 'asc' } });

  res.json({ result, submissions, events });
});

router.post('/sessions/:sessionId/recompute-score', async (req: AuthRequest, res) => {
  const submissions = await prisma.stepSubmission.findMany({ where: { sessionId: req.params.sessionId, organizationId: req.organizationId } });
  for (const sub of submissions) {
    await scoringQueue.add('scoreSubmission', { submissionId: sub.id, organizationId: req.organizationId });
  }
  res.json({ queued: submissions.length });
});

router.post('/step-submissions/:submissionId/recompute-score', async (req: AuthRequest, res) => {
  const sub = await prisma.stepSubmission.findFirst({ where: { id: req.params.submissionId, organizationId: req.organizationId } });
  if (!sub) { res.status(404).json({ error: 'Not found' }); return; }
  await scoringQueue.add('scoreSubmission', { submissionId: sub.id, organizationId: req.organizationId });
  res.json({ queued: true });
});

// Manual reviews
router.post('/sessions/:sessionId/manual-reviews', async (req: AuthRequest, res) => {
  const review = await prisma.manualReview.create({
    data: { organizationId: req.organizationId!, sessionId: req.params.sessionId, reviewerUserId: req.userId!, ...req.body },
  });
  res.status(201).json(review);
});

router.post('/step-submissions/:submissionId/manual-reviews', async (req: AuthRequest, res) => {
  const sub = await prisma.stepSubmission.findFirst({ where: { id: req.params.submissionId, organizationId: req.organizationId } });
  if (!sub) { res.status(404).json({ error: 'Not found' }); return; }
  const review = await prisma.manualReview.create({
    data: { organizationId: req.organizationId!, sessionId: sub.sessionId, submissionId: sub.id, reviewerUserId: req.userId!, ...req.body },
  });
  if (review.score !== null) {
    await prisma.stepSubmission.update({ where: { id: sub.id }, data: { scoringStatus: 'scored', score: { ...(sub.score as any), totalScore: review.score, scoringMode: 'manual' } } });
  }
  res.status(201).json(review);
});

router.patch('/manual-reviews/:reviewId', async (req: AuthRequest, res) => {
  const review = await prisma.manualReview.updateMany({ where: { id: req.params.reviewId, organizationId: req.organizationId }, data: req.body });
  res.json(review);
});

export default router;
