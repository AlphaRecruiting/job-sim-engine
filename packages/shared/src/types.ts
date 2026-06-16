import { STEP_TYPES, USER_ROLES, JOB_STATUSES, SESSION_STATUSES, SCORING_STATUSES, RECOMMENDATIONS } from './constants';

export type SimulationStepType = typeof STEP_TYPES[number];
export type UserRole = typeof USER_ROLES[number];
export type JobStatus = typeof JOB_STATUSES[number];
export type SessionStatus = typeof SESSION_STATUSES[number];
export type ScoringStatus = typeof SCORING_STATUSES[number];
export type Recommendation = typeof RECOMMENDATIONS[number];

export interface SimulationVersionSnapshot {
  simulation: {
    id: string;
    title: string;
    description?: string;
    estimatedDurationMinutes?: number;
  };
  steps: Array<{
    id: string;
    orderIndex: number;
    type: SimulationStepType;
    title: string;
    instructions: string;
    timeLimitSeconds?: number;
    isRequired: boolean;
    config: unknown;
    scoringConfig?: unknown;
    skillMapping?: Array<{ skill: string; weight: number }>;
  }>;
  scenarioAssets: Array<{
    id: string;
    type: string;
    title: string;
    content: unknown;
  }>;
  resultConfig?: {
    stepWeights?: Record<string, number>;
    recommendationThresholds?: {
      strongYes: number;
      yes: number;
      maybe: number;
    };
  };
}

export interface PublicCandidateStep {
  id: string;
  orderIndex: number;
  type: SimulationStepType;
  title: string;
  instructions: string;
  timeLimitSeconds?: number;
  isRequired: boolean;
  publicConfig: unknown;
}

export interface StepScore {
  stepId: string;
  stepType: SimulationStepType;
  totalScore: number;
  maxScore: number;
  criteria: Array<{
    key: string;
    label: string;
    score: number;
    maxScore: number;
    evidence?: string;
  }>;
  skillScores: Array<{
    skill: string;
    score: number;
    weight: number;
  }>;
  redFlags: Array<{
    key: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
  summary: string;
  scoringMode: 'deterministic' | 'ai_rubric' | 'hybrid' | 'manual';
  confidence: number;
  needsManualReview: boolean;
}

export interface AiRecommendedStep {
  id: string;
  type: SimulationStepType;
  title: string;
  reason: string;
  targetSkills: string[];
  estimatedDurationMinutes: number;
  suggestedConfig: unknown;
  suggestedScoringConfig: unknown;
  confidence: number;
}

export interface AiSimulationRecommendation {
  roleProfile: {
    title: string;
    seniority: string;
    department: string;
    roleFamily: string;
    likelyWorkEnvironment: string;
  };
  extractedSkills: Array<{
    skill: string;
    evidenceFromJobPost: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    testability: 'low' | 'medium' | 'high';
  }>;
  recommendedSteps: AiRecommendedStep[];
  omittedSkills: Array<{
    skill: string;
    reasonNotTested: string;
  }>;
  risksAndBiasNotes: string[];
}

export interface CandidateResultSummary {
  sessionId: string;
  candidateId: string;
  totalScore: number | null;
  recommendation: Recommendation | null;
  skillScores: Record<string, number>;
  redFlags: StepScore['redFlags'];
  summary: string | null;
}
