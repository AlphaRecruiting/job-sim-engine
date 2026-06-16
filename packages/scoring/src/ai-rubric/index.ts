import OpenAI from 'openai';
import { StepScore, SimulationStepType } from '@job-sim/shared';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AiRubricInput {
  roleContext: string;
  stepInstructions: string;
  rubric: Array<{ key: string; label: string; maxScore: number; description: string }>;
  expectedSignals: string[];
  redFlagDescriptions: string[];
  candidateAnswer: string;
  stepId: string;
  stepType: SimulationStepType;
}

const EVALUATOR_SYSTEM_PROMPT = `You are evaluating a candidate's work-simulation response for a hiring process.

Rules:
- Evaluate only the candidate's submitted work and observable behavior
- Do not evaluate protected characteristics: accent, gender, ethnicity, nationality, age, disability, or family status
- Cite specific evidence from the candidate's answer for each criterion
- Be specific and objective
- Do not be overly generous; if evidence is missing, give a lower score
- If answer is irrelevant or empty, score very low
- If uncertainty is high, set needsManualReview to true
- Output ONLY valid JSON matching the provided schema`;

export async function scoreWithAiRubric(input: AiRubricInput): Promise<{ score: StepScore; traceInput: unknown; traceOutput: unknown }> {
  const prompt = `Role context:
${input.roleContext}

Step instructions:
${input.stepInstructions}

Scoring rubric:
${JSON.stringify(input.rubric, null, 2)}

Expected positive signals:
${input.expectedSignals.map(s => `- ${s}`).join('\n')}

Red flags to watch for:
${input.redFlagDescriptions.map(s => `- ${s}`).join('\n')}

Candidate answer:
${input.candidateAnswer}

Output JSON matching this exact schema:
{
  "totalScore": number (0-100),
  "criteria": [{ "key": string, "label": string, "score": number, "maxScore": number, "evidence": string }],
  "skillScores": [],
  "redFlags": [{ "key": string, "severity": "low"|"medium"|"high", "message": string }],
  "summary": string,
  "confidence": number (0-1),
  "needsManualReview": boolean
}`;

  const startMs = Date.now();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: EVALUATOR_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });
  const latencyMs = Date.now() - startMs;

  const raw = JSON.parse(completion.choices[0].message.content || '{}');

  const score: StepScore = {
    stepId: input.stepId,
    stepType: input.stepType,
    totalScore: raw.totalScore ?? 0,
    maxScore: 100,
    criteria: raw.criteria ?? [],
    skillScores: raw.skillScores ?? [],
    redFlags: raw.redFlags ?? [],
    summary: raw.summary ?? '',
    scoringMode: 'ai_rubric',
    confidence: raw.confidence ?? 0.5,
    needsManualReview: raw.needsManualReview ?? false,
  };

  return {
    score,
    traceInput: { prompt: prompt.slice(0, 2000) },
    traceOutput: { raw, latencyMs, model: 'gpt-4o' },
  };
}

export async function scoreCallTranscript(input: {
  transcript: Array<{ speaker: string; text: string }>;
  rubric: Array<{ key: string; label: string; maxScore: number; description: string }>;
  publicBrief: string;
  outcome: unknown;
  metrics: unknown;
  stepId: string;
}): Promise<{ score: StepScore; traceInput: unknown; traceOutput: unknown }> {
  const transcriptText = input.transcript.map(t => `${t.speaker === 'candidate' ? 'CANDIDATE' : 'BUYER'}: ${t.text}`).join('\n');

  return scoreWithAiRubric({
    roleContext: input.publicBrief,
    stepInstructions: 'Evaluate this sales discovery call transcript.',
    rubric: input.rubric,
    expectedSignals: ['Opens with discovery question', 'Quantifies business pain', 'Handles objections specifically', 'Proposes clear next step'],
    redFlagDescriptions: ['Starts with generic pitch', 'Ignores buyer concerns', 'Pressures for immediate commitment', 'Makes up facts about product', 'Talks more than listens'],
    candidateAnswer: `Transcript:\n${transcriptText}\n\nOutcome: ${JSON.stringify(input.outcome)}\nMetrics: ${JSON.stringify(input.metrics)}`,
    stepId: input.stepId,
    stepType: 'simulated_call',
  });
}
