import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { getModule } from '@job-sim/simulation-modules';
import { scoringQueue } from '../lib/queues';
import { SimulationVersionSnapshot } from '@job-sim/shared';

const router = Router();

// Get application info (candidate facing - no auth required, uses opaque token)
router.get('/application/:token', async (req, res) => {
  const session = await prisma.simulationSession.findFirst({
    where: { sessionToken: req.params.token },
    include: { jobPosting: { select: { title: true, description: true, department: true } }, simulationVersion: { select: { versionNumber: true, publishedAt: true } } },
  });

  if (!session) {
    // Try as application token (for new sessions before session creation)
    const app = await prisma.application.findFirst({
      where: { id: req.params.token },
      include: { jobPosting: { select: { title: true, description: true, department: true } }, candidate: { select: { name: true, email: true } } },
    });
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ type: 'application', application: app });
    return;
  }

  res.json({ type: 'session', session });
});

// Start simulation session
router.post('/application/:token/start', async (req, res) => {
  const application = await prisma.application.findUnique({
    where: { id: req.params.token },
    include: { jobPosting: true },
  });
  if (!application) { res.status(404).json({ error: 'Application not found' }); return; }

  // Find active simulation version
  const job = await prisma.jobPosting.findUnique({ where: { id: application.jobPostingId } });
  if (!job?.activeSimulationVersionId) { res.status(400).json({ error: 'No active simulation for this job' }); return; }

  const version = await prisma.simulationVersion.findUnique({ where: { id: job.activeSimulationVersionId } });
  if (!version) { res.status(400).json({ error: 'Simulation version not found' }); return; }

  // Check for existing session
  const existing = await prisma.simulationSession.findFirst({
    where: { applicationId: application.id, status: { in: ['not_started', 'in_progress'] } },
  });
  if (existing) { res.json(existing); return; }

  const snapshot = version.snapshot as unknown as SimulationVersionSnapshot;
  const firstStepId = snapshot.steps[0]?.id;

  const session = await prisma.simulationSession.create({
    data: {
      organizationId: application.organizationId,
      applicationId: application.id,
      candidateId: application.candidateId,
      jobPostingId: application.jobPostingId,
      simulationId: job.activeSimulationId!,
      simulationVersionId: version.id,
      status: 'in_progress',
      currentStepId: firstStepId,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.application.update({ where: { id: application.id }, data: { status: 'simulation_in_progress' } });
  await prisma.simulationEvent.create({ data: { organizationId: application.organizationId, sessionId: session.id, eventType: 'session_started' } });

  res.status(201).json(session);
});

// Get session state
router.get('/sessions/:sessionToken', async (req, res) => {
  const session = await prisma.simulationSession.findFirst({
    where: { sessionToken: req.params.sessionToken },
  });
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

  const version = await prisma.simulationVersion.findUnique({ where: { id: session.simulationVersionId } });
  const snapshot = version?.snapshot as unknown as SimulationVersionSnapshot;

  // Strip hidden config from each step
  const publicSteps = snapshot?.steps.map(step => {
    const mod = getModule(step.type);
    return { id: step.id, orderIndex: step.orderIndex, type: step.type, title: step.title, instructions: step.instructions, timeLimitSeconds: step.timeLimitSeconds, isRequired: step.isRequired, publicConfig: mod.getPublicCandidateConfig(step.config) };
  }) ?? [];

  const submissions = await prisma.stepSubmission.findMany({ where: { sessionId: session.id }, select: { stepId: true, status: true, submittedAt: true } });

  res.json({ session, steps: publicSteps, submissions });
});

// Get single step (with public config only)
router.get('/sessions/:sessionToken/steps/:stepId', async (req, res) => {
  const session = await prisma.simulationSession.findFirst({ where: { sessionToken: req.params.sessionToken } });
  if (!session) { res.status(404).json({ error: 'Not found' }); return; }

  const version = await prisma.simulationVersion.findUnique({ where: { id: session.simulationVersionId } });
  const snapshot = version?.snapshot as unknown as SimulationVersionSnapshot;
  const step = snapshot?.steps.find(s => s.id === req.params.stepId);
  if (!step) { res.status(404).json({ error: 'Step not found' }); return; }

  const mod = getModule(step.type);
  const existingSubmission = await prisma.stepSubmission.findFirst({ where: { sessionId: session.id, stepId: step.id } });
  const autosave = await prisma.simulationEvent.findFirst({ where: { sessionId: session.id, stepId: step.id, eventType: 'autosave' }, orderBy: { createdAt: 'desc' } });

  res.json({
    step: { id: step.id, orderIndex: step.orderIndex, type: step.type, title: step.title, instructions: step.instructions, timeLimitSeconds: step.timeLimitSeconds, isRequired: step.isRequired, publicConfig: mod.getPublicCandidateConfig(step.config) },
    submission: existingSubmission ? { status: existingSubmission.status, submittedAt: existingSubmission.submittedAt } : null,
    autosavedAnswer: (autosave?.payload as any)?.answer ?? null,
  });
});

// Track events
router.post('/sessions/:sessionToken/steps/:stepId/events', async (req, res) => {
  const session = await prisma.simulationSession.findFirst({ where: { sessionToken: req.params.sessionToken } });
  if (!session) { res.status(404).json({ error: 'Not found' }); return; }

  await prisma.simulationEvent.create({
    data: { organizationId: session.organizationId, sessionId: session.id, stepId: req.params.stepId, eventType: req.body.eventType, payload: req.body.payload },
  });
  res.json({ success: true });
});

// Autosave
router.post('/sessions/:sessionToken/steps/:stepId/autosave', async (req, res) => {
  const session = await prisma.simulationSession.findFirst({ where: { sessionToken: req.params.sessionToken } });
  if (!session) { res.status(404).json({ error: 'Not found' }); return; }

  await prisma.simulationEvent.create({
    data: { organizationId: session.organizationId, sessionId: session.id, stepId: req.params.stepId, eventType: 'autosave', payload: { answer: req.body.answer } },
  });
  res.json({ success: true });
});

// Submit step
router.post('/sessions/:sessionToken/steps/:stepId/submit', async (req, res) => {
  const session = await prisma.simulationSession.findFirst({ where: { sessionToken: req.params.sessionToken } });
  if (!session || session.status !== 'in_progress') { res.status(400).json({ error: 'Invalid session' }); return; }

  const version = await prisma.simulationVersion.findUnique({ where: { id: session.simulationVersionId } });
  const snapshot = version?.snapshot as unknown as SimulationVersionSnapshot;
  const step = snapshot?.steps.find(s => s.id === req.params.stepId);
  if (!step) { res.status(404).json({ error: 'Step not found' }); return; }

  const mod = getModule(step.type);
  const validation = mod.validateAnswer(req.body.answer);
  if (!validation.success) { res.status(400).json({ error: 'Invalid answer', details: validation.errors }); return; }

  const existing = await prisma.stepSubmission.findFirst({ where: { sessionId: session.id, stepId: step.id } });
  if (existing) { res.json(existing); return; }

  const submission = await prisma.stepSubmission.create({
    data: {
      organizationId: session.organizationId,
      sessionId: session.id,
      candidateId: session.candidateId,
      simulationVersionId: session.simulationVersionId,
      stepId: step.id,
      stepType: step.type,
      status: 'submitted',
      submittedAt: new Date(),
      answer: req.body.answer,
      scoringStatus: 'queued',
    },
  });

  await scoringQueue.add('scoreSubmission', { submissionId: submission.id, organizationId: session.organizationId });
  await prisma.simulationEvent.create({ data: { organizationId: session.organizationId, sessionId: session.id, stepId: step.id, eventType: 'step_submitted' } });

  // Advance to next step
  const currentIndex = snapshot.steps.findIndex(s => s.id === step.id);
  const nextStep = snapshot.steps[currentIndex + 1];
  await prisma.simulationSession.update({ where: { id: session.id }, data: { currentStepId: nextStep?.id ?? null } });

  res.json({ submission, nextStepId: nextStep?.id ?? null });
});

// Complete session
router.post('/sessions/:sessionToken/complete', async (req, res) => {
  const session = await prisma.simulationSession.findFirst({ where: { sessionToken: req.params.sessionToken } });
  if (!session) { res.status(404).json({ error: 'Not found' }); return; }

  await prisma.simulationSession.update({ where: { id: session.id }, data: { status: 'completed', completedAt: new Date() } });
  await prisma.application.update({ where: { id: session.applicationId }, data: { status: 'simulation_completed' } });
  await prisma.simulationEvent.create({ data: { organizationId: session.organizationId, sessionId: session.id, eventType: 'session_completed' } });

  // Create or update candidate result record
  await prisma.candidateResult.upsert({
    where: { sessionId: session.id },
    create: { organizationId: session.organizationId, sessionId: session.id, applicationId: session.applicationId, candidateId: session.candidateId, jobPostingId: session.jobPostingId, simulationVersionId: session.simulationVersionId, status: 'pending' },
    update: { status: 'pending' },
  });

  res.json({ success: true });
});

export default router;
