import { Job } from 'bullmq';
import { prisma } from '../lib/prisma';

export async function processAnalyticsJob(job: Job) {
  const { jobPostingId, organizationId } = job.data;
  console.log(`[analytics] Recomputing analytics for job ${jobPostingId}`);

  const results = await prisma.candidateResult.findMany({
    where: { jobPostingId, organizationId },
  });

  const scores = results.map(r => r.totalScore).filter((s): s is number => s !== null);
  const completed = results.filter(r => r.status === 'complete').length;

  console.log(`[analytics] Job ${jobPostingId}: ${results.length} results, avg score: ${scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 'N/A'}`);
}
