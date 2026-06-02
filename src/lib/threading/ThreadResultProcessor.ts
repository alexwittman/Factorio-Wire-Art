import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "./ThreadResult";
import type { ThreadStats } from "./ThreadStats";

export class ThreadResultProcessor {
  getStats(
    result: ThreadResult,
    layout: IPinLayout,
    executionTimeMs: number,
  ): ThreadStats {
    const totalThreads = result.sequence.length;
    const [pinAvgThreadCount, pinMaxThreadCount, pinMinThreadCount] =
      this.getPinStats(result, layout);
    const [longestThreadLength, shortestThreadLength, totalThreadLength] =
      this.getThreadStats(result, layout);

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
    result: ThreadResult,
    layout: IPinLayout,
  ): [number, number, number] {
    const pinCounts = new Array(layout.pins.length).fill(0);

    for (const [pinA, pinB] of result.sequence) {
      pinCounts[pinA]++;
      pinCounts[pinB]++;
    }

    const min = Math.min(...pinCounts);
    const max = Math.max(...pinCounts);
    const average =
      pinCounts.reduce((sum, count) => sum + count, 0) / pinCounts.length;

    return [average, max, min];
  }

  getThreadStats(
    result: ThreadResult,
    layout: IPinLayout,
  ): [number, number, number] {
    let shortestThreadLength = Number.MAX_VALUE;
    let longestThreadLength = 0;
    let totalThreadLength = 0;
    for (let i = 0; i < result.sequence.length; i++) {
      let pair = result.sequence[i];
      let pin0 = layout.pins[pair[0]];
      let pin1 = layout.pins[pair[1]];

      let length = Math.sqrt(
        Math.pow(pin1.x - pin0.x, 2) + Math.pow(pin1.y - pin0.y, 2),
      );

      totalThreadLength += length;

      if (length < shortestThreadLength) {
        shortestThreadLength = length;
      }

      if (length > longestThreadLength) {
        longestThreadLength = length;
      }
    }

    return [longestThreadLength, shortestThreadLength, totalThreadLength];
  }
}
