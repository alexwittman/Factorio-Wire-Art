import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "./ThreadResult";
import type { ThreadStats } from "./ThreadStats";

export class ThreadResultProcessor {
  getStats(
    results: ThreadResult[],
    layout: IPinLayout,
    executionTimeMs: number,
  ): ThreadStats {
    const totalThreads = results.reduce((sum, r) => sum + r.sequence.length, 0);

    const [pinAvgThreadCount, pinMaxThreadCount, pinMinThreadCount] =
      this.getPinStats(results, layout);

    const [longestThreadLength, shortestThreadLength, totalThreadLength] =
      this.getThreadStats(results, layout);

    return {
      totalThreads,
      executionTimeMs,
      pinAvgThreadCount,
      pinMaxThreadCount,
      pinMinThreadCount,
      longestThreadLength,
      shortestThreadLength,
      totalThreadLength,
    };
  }

  getPinStats(
    results: ThreadResult[],
    layout: IPinLayout,
  ): [number, number, number] {
    const pinCounts = new Array(layout.pins.length).fill(0);

    for (const result of results) {
      for (const [pinA, pinB] of result.sequence) {
        pinCounts[pinA]++;
        pinCounts[pinB]++;
      }
    }

    const min = Math.min(...pinCounts);
    const max = Math.max(...pinCounts);
    const average =
      pinCounts.reduce((sum, count) => sum + count, 0) / pinCounts.length;

    return [average, max, min];
  }

  getThreadStats(
    results: ThreadResult[],
    layout: IPinLayout,
  ): [number, number, number] {
    let shortestThreadLength = Number.MAX_VALUE;
    let longestThreadLength = 0;
    let totalThreadLength = 0;

    for (const result of results) {
      for (const [idxA, idxB] of result.sequence) {
        const pin0 = layout.pins[idxA];
        const pin1 = layout.pins[idxB];

        const length = Math.sqrt(
          Math.pow(pin1.x - pin0.x, 2) + Math.pow(pin1.y - pin0.y, 2),
        );

        totalThreadLength += length;
        if (length < shortestThreadLength) shortestThreadLength = length;
        if (length > longestThreadLength) longestThreadLength = length;
      }
    }

    return [longestThreadLength, shortestThreadLength, totalThreadLength];
  }
}
