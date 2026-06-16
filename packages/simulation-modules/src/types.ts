import { z } from 'zod';
import { StepScore } from '@job-sim/shared';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export interface SessionScoringContext {
  sessionId: string;
  candidateId: string;
  jobPostingId: string;
  stepIndex: number;
  totalSteps: number;
}

export interface SimulationEventRecord {
  eventType: string;
  payload: unknown;
  createdAt: Date;
}

export interface ModuleAnalytics {
  moduleType: string;
  totalSubmissions: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  commonRedFlags: Array<{ key: string; count: number }>;
  averageTimeSeconds: number;
  completionRate: number;
}

export interface ModuleScoringInput<TConfig, TAnswer> {
  config: TConfig;
  scoringConfig: unknown;
  answer: TAnswer;
  events: SimulationEventRecord[];
  sessionContext: SessionScoringContext;
}

export interface SimulationModule<TConfig, TAnswer> {
  type: string;
  label: string;
  description: string;

  configSchema: z.ZodType<TConfig>;
  answerSchema: z.ZodType<TAnswer>;

  validateConfig(config: unknown): ValidationResult<TConfig>;
  validateAnswer(answer: unknown): ValidationResult<TAnswer>;
  getPublicCandidateConfig(config: TConfig): unknown;

  score(input: ModuleScoringInput<TConfig, TAnswer>): Promise<StepScore>;
  summarizeAnalytics(submissions: Array<{ answer: unknown; score: unknown; events: SimulationEventRecord[]; timeSpentSeconds?: number }>): Promise<ModuleAnalytics>;
}
