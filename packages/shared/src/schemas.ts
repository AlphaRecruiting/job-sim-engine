import { z } from 'zod';

export const StepScoreSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),
  totalScore: z.number().min(0).max(100),
  maxScore: z.number().default(100),
  criteria: z.array(z.object({
    key: z.string(),
    label: z.string(),
    score: z.number(),
    maxScore: z.number(),
    evidence: z.string().optional(),
  })),
  skillScores: z.array(z.object({
    skill: z.string(),
    score: z.number().min(0).max(100),
    weight: z.number(),
  })),
  redFlags: z.array(z.object({
    key: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    message: z.string(),
  })),
  summary: z.string(),
  scoringMode: z.enum(['deterministic', 'ai_rubric', 'hybrid', 'manual', 'algorithmic']),
  confidence: z.number().min(0).max(1),
  needsManualReview: z.boolean(),
});

export const CreateJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  department: z.string().optional(),
  location: z.string().optional(),
  remotePolicy: z.string().optional(),
  seniority: z.string().optional(),
  employmentType: z.string().optional(),
});

export const CreateSimulationSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  estimatedDurationMinutes: z.number().optional(),
});

export const CreateStepSchema = z.object({
  type: z.string(),
  title: z.string().min(1),
  instructions: z.string().min(1),
  timeLimitSeconds: z.number().optional(),
  isRequired: z.boolean().default(true),
  config: z.record(z.unknown()),
  scoringConfig: z.record(z.unknown()).optional(),
  skillMapping: z.array(z.object({ skill: z.string(), weight: z.number() })).optional(),
});

export const ReorderStepsSchema = z.object({
  stepIds: z.array(z.string()),
});

export const InviteCandidateSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const SubmitStepSchema = z.object({
  answer: z.record(z.unknown()),
});

export const AutosaveSchema = z.object({
  answer: z.record(z.unknown()),
});

export const TrackEventSchema = z.object({
  eventType: z.string(),
  payload: z.record(z.unknown()).optional(),
});

export const ManualReviewSchema = z.object({
  score: z.number().optional(),
  decision: z.string().optional(),
  notes: z.string().optional(),
  overridePayload: z.record(z.unknown()).optional(),
});

export const AcceptRecommendationSchema = z.object({
  simulationId: z.string(),
  selectedRecommendationStepIds: z.array(z.string()),
});
