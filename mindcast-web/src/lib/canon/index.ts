export { slugifyTopic, normalizeTopic } from './topic-slug';
export {
  findOrCreateTopic,
  recordRequest,
  generateEmbedding,
  findSimilarTopics,
  checkCanonCache,
  cloneCanonEpisode,
} from './topic-service';
export {
  computeCanonScore,
  evaluatePromotion,
  scoreAndPromote,
  evaluateAllCandidates,
  PROMOTION_THRESHOLDS,
} from './scoring';
export {
  processCanonJob,
  processQueuedCanonJobs,
} from './remaster-processor';
