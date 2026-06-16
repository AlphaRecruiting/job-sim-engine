import { StepScore, CandidateResultSummary } from '@job-sim/shared';

export interface StepWithWeight {
  stepId: string;
  score: StepScore;
  weight: number;
  skillMapping: Array<{ skill: string; weight: number }>;
}

export function aggregateCandidateResult(steps: StepWithWeight[]): Omit<CandidateResultSummary, 'sessionId' | 'candidateId'> {
  const scoredSteps = steps.filter(s => s.score.totalScore > 0 || s.score.scoringMode === 'deterministic');

  const totalWeight = scoredSteps.reduce((sum, s) => sum + s.weight, 0);
  const totalScore = totalWeight > 0
    ? scoredSteps.reduce((sum, s) => sum + (s.score.totalScore * s.weight), 0) / totalWeight
    : null;

  // Aggregate skill scores
  const skillAccumulator: Record<string, { totalWeightedScore: number; totalWeight: number }> = {};
  for (const step of scoredSteps) {
    for (const sm of step.skillMapping) {
      if (!skillAccumulator[sm.skill]) {
        skillAccumulator[sm.skill] = { totalWeightedScore: 0, totalWeight: 0 };
      }
      const skillScore = step.score.skillScores.find(ss => ss.skill === sm.skill)?.score ?? step.score.totalScore;
      skillAccumulator[sm.skill].totalWeightedScore += skillScore * sm.weight;
      skillAccumulator[sm.skill].totalWeight += sm.weight;
    }
  }

  const skillScores: Record<string, number> = {};
  for (const [skill, acc] of Object.entries(skillAccumulator)) {
    skillScores[skill] = acc.totalWeight > 0 ? Math.round(acc.totalWeightedScore / acc.totalWeight) : 0;
  }

  // Collect all red flags
  const redFlags = steps.flatMap(s => s.score.redFlags);

  // Determine recommendation
  const hasHighSeverityRedFlag = redFlags.some(f => f.severity === 'high');
  let recommendation: CandidateResultSummary['recommendation'];
  if (hasHighSeverityRedFlag) {
    recommendation = 'review_required';
  } else if (totalScore === null) {
    recommendation = null;
  } else if (totalScore >= 85) {
    recommendation = 'strong_yes';
  } else if (totalScore >= 75) {
    recommendation = 'yes';
  } else if (totalScore >= 60) {
    recommendation = 'maybe';
  } else {
    recommendation = 'no';
  }

  return {
    totalScore: totalScore !== null ? Math.round(totalScore) : null,
    recommendation,
    skillScores,
    redFlags,
    summary: totalScore !== null ? `Overall score: ${Math.round(totalScore)}%. Recommendation: ${recommendation}.` : 'Scoring in progress.',
  };
}
