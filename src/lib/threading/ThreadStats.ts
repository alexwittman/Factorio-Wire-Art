export type ThreadStats = {
  totalThreads: number;
  executionTimeMs: number;
  pinAvgThreadCount: number;
  pinMaxThreadCount: number;
  pinMinThreadCount: number;
  longestThreadLength: number;
  shortestThreadLength: number;
  totalThreadLength: number;
};
