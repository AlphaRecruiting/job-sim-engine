import { z } from 'zod';
import { StepScore } from '@job-sim/shared';
import { SimulationModule, ModuleScoringInput, ModuleAnalytics, validate } from '../types';

const SlackMessageSchema = z.object({
  sender: z.string(),
  role: z.string().optional(),
  avatarInitials: z.string().optional(),
  message: z.string(),
});

const ConfigSchema = z.object({
  founderName: z.string(),
  founderRole: z.string().optional(),
  founderMessage: z.string(),
  videoUrl: z.string().optional(),
  slackMessage: SlackMessageSchema.optional(),
  minReadSeconds: z.number().default(15),
});

const AnswerSchema = z.object({
  acknowledged: z.boolean(),
  timeSpentSeconds: z.number(),
});

type Config = z.infer<typeof ConfigSchema>;
type Answer = z.infer<typeof AnswerSchema>;

export const welcomeModule: SimulationModule<Config, Answer> = {
  type: 'welcome',
  label: 'Welcome & Onboarding',
  description: 'Introductory screen with founder message and context. Tracks reading engagement.',

  configSchema: ConfigSchema,
  answerSchema: AnswerSchema,

  validateConfig: (c) => validate(ConfigSchema, c),
  validateAnswer: (a) => validate(AnswerSchema, a),

  getPublicCandidateConfig(config: Config) {
    return {
      founderName: config.founderName,
      founderRole: config.founderRole,
      founderMessage: config.founderMessage,
      videoUrl: config.videoUrl,
      slackMessage: config.slackMessage,
      minReadSeconds: config.minReadSeconds,
    };
  },

  async score(input: ModuleScoringInput<Config, Answer>): Promise<StepScore> {
    const { config, answer } = input;
    const minSec = config.minReadSeconds ?? 15;
    const spent = answer.timeSpentSeconds ?? 0;

    let engagementScore: number;
    if (spent >= minSec * 2) engagementScore = 100;
    else if (spent >= minSec) engagementScore = 75;
    else if (spent >= minSec * 0.5) engagementScore = 40;
    else engagementScore = 10;

    const redFlags = spent < 5 ? [{ key: 'skipped_onboarding', severity: 'medium' as const, message: 'Candidate skipped the welcome screen in under 5 seconds' }] : [];

    return {
      stepId: input.sessionContext.sessionId,
      stepType: 'welcome',
      totalScore: answer.acknowledged ? engagementScore : 0,
      maxScore: 100,
      criteria: [
        { key: 'engagement', label: 'Onboarding engagement', score: engagementScore, maxScore: 100, evidence: `Read for ${spent}s (minimum recommended: ${minSec}s)` },
      ],
      skillScores: [],
      redFlags,
      summary: `Spent ${spent}s on welcome screen. ${redFlags.length ? 'Appears to have skipped context.' : 'Engaged with onboarding content.'}`,
      scoringMode: 'algorithmic',
      confidence: 0.9,
      needsManualReview: false,
    };
  },

  async summarizeAnalytics(submissions): Promise<ModuleAnalytics> {
    const times = submissions.map(s => (s.answer as any)?.timeSpentSeconds ?? 0);
    const avg = times.length ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0;
    return { moduleType: 'welcome', totalSubmissions: submissions.length, averageScore: avg, scoreDistribution: {}, commonRedFlags: [], averageTimeSeconds: avg, completionRate: 1 };
  },
};
