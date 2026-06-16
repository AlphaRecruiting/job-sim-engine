import { Queue } from 'bullmq';
import { redis } from './redis';

const connection = { host: redis.options.host, port: redis.options.port };

export const scoringQueue = new Queue('scoring', { connection });
export const aiRecommendationQueue = new Queue('ai-recommendations', { connection });
export const analyticsQueue = new Queue('analytics', { connection });
