import { Job } from 'bullmq';
import OpenAI from 'openai';
import https from 'https';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 25000,
  httpAgent: new https.Agent({ keepAlive: true }),
});

const MODULE_TYPES = [
  { type: 'multiple_choice', description: 'Knowledge check or scenario decision with predefined options. Deterministic scoring.' },
  { type: 'free_text', description: 'Open written response. AI rubric scoring. Good for case questions, strategy, or reasoning.' },
  { type: 'crm_prioritization', description: 'Candidate ranks CRM records (leads, accounts, tickets). Hybrid scoring. Tests prioritization and business judgment.' },
  { type: 'notification_reaction', description: 'Candidate handles competing incoming messages. Hybrid scoring. Tests communication, prioritization, and escalation judgment.' },
  { type: 'email_response', description: 'Candidate writes a professional email reply. AI rubric scoring. Tests written communication, empathy, and persuasion.' },
  { type: 'simulated_call', description: 'Candidate speaks with a realtime AI buyer/customer/stakeholder. AI rubric scoring of transcript. Tests discovery, objection handling, and value articulation.' },
];

const SYSTEM_PROMPT = `You are designing a job simulation for hiring. Read the job posting and recommend realistic work-simulation steps that test whether a candidate can perform the job.

Rules:
- Only recommend steps that directly map to responsibilities in the job post
- Prefer realistic work tasks over trivia or personality tests
- For sales or customer-facing roles, strongly consider simulated_call module
- Include hidden signals and scoring rubrics in config
- Avoid protected-class, personality, or culture-fit scoring
- Flag potential bias risks
- Output strict JSON only`;

export async function processAiRecommendationJob(job: Job) {
  const { runId, organizationId } = job.data;
  console.log(`[ai-recommendations] Processing run ${runId}`);

  const run = await prisma.aiRecommendationRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error(`Run ${runId} not found`);

  await prisma.aiRecommendationRun.update({ where: { id: runId }, data: { status: 'processing' } });

  const jobPost = run.inputJobPost as any;

  const prompt = `Job posting:
Title: ${jobPost.title}
Department: ${jobPost.department ?? 'Not specified'}
Seniority: ${jobPost.seniority ?? 'Not specified'}
Description:
${jobPost.description}

Available module types:
${MODULE_TYPES.map(m => `- ${m.type}: ${m.description}`).join('\n')}

Output a JSON object with this exact structure:
{
  "roleProfile": {
    "title": string,
    "seniority": string,
    "department": string,
    "roleFamily": string,
    "likelyWorkEnvironment": string
  },
  "extractedSkills": [
    {
      "skill": string,
      "evidenceFromJobPost": string,
      "importance": "low" | "medium" | "high" | "critical",
      "testability": "low" | "medium" | "high"
    }
  ],
  "recommendedSteps": [
    {
      "id": string (unique like "rec_step_1"),
      "type": one of the available module types,
      "title": string,
      "reason": string (why this step tests a key skill),
      "targetSkills": string[],
      "estimatedDurationMinutes": number,
      "suggestedConfig": object matching the module's config shape,
      "suggestedScoringConfig": object,
      "confidence": number (0-1)
    }
  ],
  "omittedSkills": [
    {
      "skill": string,
      "reasonNotTested": string
    }
  ],
  "risksAndBiasNotes": string[]
}

For simulated_call steps, suggestedConfig must include: callType, publicCandidateBrief, aiPersona (name/role/company/personality/communicationStyle/baselineMood), publicBusinessContext, hiddenBuyerState (with hiddenObjections and buyingCriteria), allowedOutcomes, guardrails, scoringRubric, estimatedDurationSeconds, maxDurationSeconds, title.

Generate 3-5 recommended steps appropriate for the role.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    await prisma.aiRecommendationRun.update({
      where: { id: runId },
      data: { status: 'completed', result },
    });

    // Store AI trace
    await prisma.aiEvaluationTrace.create({
      data: {
        organizationId,
        relatedEntityType: 'ai_recommendation_run',
        relatedEntityId: runId,
        model: 'gpt-4o',
        promptVersion: '1.0',
        inputHash: runId,
        redactedInput: { prompt: prompt.slice(0, 1000) } as any,
        output: result,
        latencyMs: 0,
      },
    });

    console.log(`[ai-recommendations] Run ${runId} completed with ${result.recommendedSteps?.length ?? 0} steps`);
  } catch (err) {
    await prisma.aiRecommendationRun.update({ where: { id: runId }, data: { status: 'failed', error: String(err) } });
    throw err;
  }
}
