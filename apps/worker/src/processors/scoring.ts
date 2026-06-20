import { Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { getModule } from '@job-sim/simulation-modules';
import { scoreWithAiRubric, scoreCallTranscript, aggregateCandidateResult } from '@job-sim/scoring';
import { SimulationVersionSnapshot, StepScore, SimulationStepType } from '@job-sim/shared';
import { deleteSheet } from '../lib/google-sheets';

export async function processScoringJob(job: Job) {
  const { submissionId, organizationId } = job.data;
  console.log(`[scoring] Processing submission ${submissionId}`);

  const submission = await prisma.stepSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new Error(`Submission ${submissionId} not found`);

  await prisma.stepSubmission.update({ where: { id: submissionId }, data: { scoringStatus: 'processing' } });

  const version = await prisma.simulationVersion.findUnique({ where: { id: submission.simulationVersionId } });
  if (!version) throw new Error(`Version not found`);

  const snapshot = version.snapshot as unknown as SimulationVersionSnapshot;
  const stepConfig = snapshot.steps.find(s => s.id === submission.stepId);
  if (!stepConfig) throw new Error(`Step config not found for ${submission.stepId}`);

  const events = await prisma.simulationEvent.findMany({ where: { sessionId: submission.sessionId, stepId: submission.stepId }, orderBy: { createdAt: 'asc' } });

  const mod = getModule(submission.stepType);
  const session = await prisma.simulationSession.findUnique({ where: { id: submission.sessionId } });

  let score: StepScore;
  let traceInput: unknown = null;
  let traceOutput: unknown = null;

  try {
    // Run the module's base scorer first
    const baseScore = await mod.score({
      config: stepConfig.config,
      scoringConfig: stepConfig.scoringConfig,
      answer: submission.answer as any,
      events: events.map(e => ({ eventType: e.eventType, payload: e.payload, createdAt: e.createdAt })),
      sessionContext: {
        sessionId: submission.sessionId,
        candidateId: submission.candidateId,
        jobPostingId: session?.jobPostingId ?? '',
        stepIndex: stepConfig.orderIndex,
        totalSteps: snapshot.steps.length,
      },
    });

    // For AI rubric types, run actual AI scoring
    if (baseScore.scoringMode === 'ai_rubric') {
      if (submission.stepType === 'simulated_call') {
        const answer = submission.answer as any;
        const result = await scoreCallTranscript({
          transcript: answer.transcript ?? [],
          rubric: (stepConfig.config as any).scoringRubric ?? [],
          publicBrief: (stepConfig.config as any).publicCandidateBrief ?? '',
          outcome: answer.outcome,
          metrics: answer.metrics,
          stepId: submission.stepId,
        });
        score = result.score;
        traceInput = result.traceInput;
        traceOutput = result.traceOutput;
      } else {
        const answer = submission.answer as any;
        const answerText = answer.text ?? answer.body ?? JSON.stringify(answer);
        const config = stepConfig.config as any;
        const result = await scoreWithAiRubric({
          roleContext: `Simulation step: ${stepConfig.title}`,
          stepInstructions: stepConfig.instructions,
          rubric: config.rubric ?? [],
          expectedSignals: config.expectedSignals ?? [],
          redFlagDescriptions: config.redFlags ?? [],
          candidateAnswer: answerText,
          stepId: submission.stepId,
          stepType: submission.stepType as SimulationStepType,
        });
        score = result.score;
        traceInput = result.traceInput;
        traceOutput = result.traceOutput;
      }
    } else if (baseScore.scoringMode === 'hybrid' && submission.stepType === 'spreadsheet_edit') {
      const config = stepConfig.config as any;
      const answer = submission.answer as any;
      const cells = config.cells ?? [];
      const totalWeight = cells.reduce((s: number, c: any) => s + (c.weight ?? 1), 0) || 1;
      const textCells = cells.filter((c: any) => c.cellType === 'text' || c.cellType === 'comment');
      const textWeight = textCells.reduce((s: number, c: any) => s + (c.weight ?? 1), 0);
      const textRatio = textWeight / totalWeight;

      if (textCells.length > 0 && textRatio > 0) {
        // Build AI rubric from textRubric config or auto-generate from text cells
        const textRubric: Array<{ key: string; label: string; maxScore: number; description: string }> =
          config.textRubric?.length > 0
            ? config.textRubric
            : textCells.map((cell: any) => ({
                key: cell.ref,
                label: cell.label,
                maxScore: 100,
                description: `Valuta il contenuto della cella ${cell.ref}: ${cell.label}`,
              }));

        const answerText = textCells.map((cell: any) => {
          const captured = (answer.capturedCells ?? []).find((c: any) => c.ref === cell.ref);
          return `${cell.label} (${cell.ref}): ${captured?.value ?? '(vuoto)'}`;
        }).join('\n');

        const result = await scoreWithAiRubric({
          roleContext: `Simulation step: ${stepConfig.title}`,
          stepInstructions: stepConfig.instructions ?? '',
          rubric: textRubric,
          expectedSignals: config.expectedSignals ?? [],
          redFlagDescriptions: config.redFlags ?? [],
          candidateAnswer: answerText,
          stepId: submission.stepId,
          stepType: submission.stepType as SimulationStepType,
        });

        // AI returns 0-100, scale to the text cells' share of the total score
        const textContribution = Math.round(result.score.totalScore * textRatio);

        score = {
          ...baseScore,
          totalScore: Math.min(100, baseScore.totalScore + textContribution),
          criteria: [...(baseScore.criteria ?? []), ...result.score.criteria],
          summary: result.score.summary,
          scoringMode: 'hybrid',
          confidence: result.score.confidence,
          needsManualReview: result.score.needsManualReview,
          redFlags: [...(baseScore.redFlags ?? []), ...result.score.redFlags],
          skillScores: [],
        };
        traceInput = result.traceInput;
        traceOutput = result.traceOutput;
      } else {
        score = baseScore;
      }

      // Cleanup candidate sheet after scoring
      if (answer.candidateSheetId) {
        deleteSheet(answer.candidateSheetId).catch(err =>
          console.error('[scoring] Failed to delete candidate sheet:', (err as any)?.message),
        );
      }
    } else {
      score = baseScore;
    }

    // Apply skill mapping to score
    if (stepConfig.skillMapping) {
      const skillMapping = stepConfig.skillMapping as Array<{ skill: string; weight: number }>;
      score.skillScores = skillMapping.map(sm => ({
        skill: sm.skill,
        score: score.totalScore,
        weight: sm.weight,
      }));
    }

    await prisma.stepSubmission.update({
      where: { id: submissionId },
      data: { score: score as any, scoringStatus: score.needsManualReview ? 'manual_review_required' : 'scored' },
    });

    // Store AI trace if applicable
    if (traceInput && traceOutput) {
      await prisma.aiEvaluationTrace.create({
        data: {
          organizationId,
          relatedEntityType: 'step_submission',
          relatedEntityId: submissionId,
          model: 'gpt-4o',
          promptVersion: '1.0',
          inputHash: submissionId,
          redactedInput: traceInput as any,
          output: traceOutput as any,
        },
      });
    }

    // Recompute candidate result
    await recomputeCandidateResult(submission.sessionId, snapshot, organizationId);

    console.log(`[scoring] Submission ${submissionId} scored: ${score.totalScore}`);
  } catch (err) {
    await prisma.stepSubmission.update({ where: { id: submissionId }, data: { scoringStatus: 'manual_review_required' } });
    throw err;
  }
}

async function recomputeCandidateResult(sessionId: string, snapshot: SimulationVersionSnapshot, organizationId: string) {
  const submissions = await prisma.stepSubmission.findMany({ where: { sessionId, scoringStatus: { in: ['scored', 'manual_review_required'] } } });

  const stepsWithScores = submissions.map(sub => {
    const stepConfig = snapshot.steps.find(s => s.id === sub.stepId);
    const skillMapping = (stepConfig?.skillMapping as Array<{ skill: string; weight: number }>) ?? [];
    return {
      stepId: sub.stepId,
      score: sub.score as unknown as StepScore,
      weight: 1,
      skillMapping,
    };
  }).filter(s => s.score && typeof s.score.totalScore === 'number');

  if (stepsWithScores.length === 0) return;

  const aggregated = aggregateCandidateResult(stepsWithScores);

  await prisma.candidateResult.upsert({
    where: { sessionId },
    create: {
      organizationId,
      sessionId,
      applicationId: (await prisma.simulationSession.findUnique({ where: { id: sessionId } }))!.applicationId,
      candidateId: (await prisma.simulationSession.findUnique({ where: { id: sessionId } }))!.candidateId,
      jobPostingId: (await prisma.simulationSession.findUnique({ where: { id: sessionId } }))!.jobPostingId,
      simulationVersionId: (await prisma.simulationSession.findUnique({ where: { id: sessionId } }))!.simulationVersionId,
      totalScore: aggregated.totalScore,
      recommendation: aggregated.recommendation,
      skillScores: aggregated.skillScores as any,
      redFlags: aggregated.redFlags as any,
      summary: aggregated.summary,
      status: 'partial',
    },
    update: {
      totalScore: aggregated.totalScore,
      recommendation: aggregated.recommendation,
      skillScores: aggregated.skillScores as any,
      redFlags: aggregated.redFlags as any,
      summary: aggregated.summary,
      status: 'partial',
    },
  });
}
