import { IPoint2D } from "$lib/lib/pins/IPinLayout";

self.onmessage = function (e) {
  const { matrix, width, pins, adjacencies, config } = e.data as {
    matrix: Float32Array;
    width: number;
    pins: IPoint2D[];
    adjacencies: number[][];
    config: any;
  };

  const numLines = config.numLines;
  const minLoop = config.minLoop;
  const lineWeight = config.lineWeight;
  const lineWidth = config.lineWidth || 1;

  const minScoreThreshold =
    config.minScoreThreshold !== undefined ? config.minScoreThreshold : 0.01;

  const imgMasked = new Float32Array(matrix);
  const imgResult = new Float32Array(width * width);
  imgResult.fill(0.95);

  let oldPin = 0;
  const lines: Array<[number, number]> = [];
  const previousPins: number[] = [];
  const startTime = performance.now();

  const liveCanvas = new OffscreenCanvas(width, width);
  const liveCtx = liveCanvas.getContext("2d")!;

  let lineCache = new Map<string, { x: Int32Array; y: Int32Array }>();

  function getLinePixels(
    p0: IPoint2D,
    p1: IPoint2D,
    lineWidth: number = 1,
  ): { x: Int32Array; y: Int32Array } {
    const isP0First = p0.x < p1.x || (p0.x === p1.x && p0.y <= p1.y);
    const k0 = isP0First ? p0 : p1;
    const k1 = isP0First ? p1 : p0;
    const key = `${k0.x},${k0.y}-${k1.x},${k1.y}-w${lineWidth}`;

    if (lineCache.has(key)) {
      return lineCache.get(key)!;
    }

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const length = Math.floor(Math.sqrt(dx * dx + dy * dy));

    if (length === 0) {
      return { x: new Int32Array(0), y: new Int32Array(0) };
    }

    const nx = -dy / length;
    const ny = dx / length;

    const basePoints = length;
    const halfWidth = (lineWidth - 1) / 2;

    const offsets: number[] = [];
    for (let w = -Math.floor(halfWidth); w <= Math.ceil(halfWidth); w++) {
      offsets.push(w);
    }

    const totalPoints = basePoints * offsets.length;
    const xValues = new Int32Array(totalPoints);
    const yValues = new Int32Array(totalPoints);

    let idx = 0;

    for (let i = 0; i < basePoints; i++) {
      const t = basePoints === 1 ? 0 : i / (basePoints - 1);

      const cx = p0.x + dx * t;
      const cy = p0.y + dy * t;

      for (const offset of offsets) {
        xValues[idx] = Math.floor(cx + nx * offset) - 1;
        yValues[idx] = Math.floor(cy + ny * offset) - 1;
        idx++;
      }
    }

    const result = { x: xValues, y: yValues };
    lineCache.set(key, result);
    return result;
  }

  for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
    let bestLineScore = minScoreThreshold;
    let bestPin = oldPin;
    const oldCoord = pins[oldPin];

    const neighbors = adjacencies[oldPin];

    for (let i = 0; i < neighbors.length; i++) {
      const pin = neighbors[i];

      if (previousPins.includes(pin)) continue;

      const coord = pins[pin];
      const lineData = getLinePixels(oldCoord, coord, lineWidth);

      let lineSum = 0;
      for (let p = 0; p < lineData.x.length; p++) {
        const px = lineData.x[p];
        const py = lineData.y[p];
        if (px >= 0 && px < width && py >= 0 && py < width) {
          lineSum += imgMasked[py * width + px];
        }
      }

      const normalizedScore =
        lineData.x.length > 0 ? lineSum / lineData.x.length : 0;

      if (normalizedScore > bestLineScore) {
        bestLineScore = normalizedScore;
        bestPin = pin;
      }
    }

    if (bestPin === oldPin) {
      console.log(`[Trace Worker] Halting early at line index ${lineIdx}.`);
      break;
    }

    if (previousPins.length >= minLoop) {
      previousPins.shift();
    }
    previousPins.push(bestPin);

    const linePixels = getLinePixels(oldCoord, pins[bestPin], lineWidth);

    for (let p = 0; p < linePixels.x.length; p++) {
      const px = linePixels.x[p];
      const py = linePixels.y[p];
      if (px >= 0 && px < width && py >= 0 && py < width) {
        const idx = py * width + px;

        imgMasked[idx] = Math.max(0.0, imgMasked[idx] - lineWeight);
        imgResult[idx] = Math.max(0.0, imgResult[idx] - lineWeight);
      }
    }

    lines.push([oldPin, bestPin]);
    oldPin = bestPin;

    if (lineIdx % 15 === 0 || lineIdx === numLines - 1) {
      const imgBufferData = liveCtx.createImageData(width, width);
      for (let i = 0; i < imgResult.length; i++) {
        const pixelVal = Math.floor(imgResult[i] * 255);
        const idx = i * 4;
        imgBufferData.data[idx] = pixelVal;
        imgBufferData.data[idx + 1] = pixelVal;
        imgBufferData.data[idx + 2] = pixelVal;
        imgBufferData.data[idx + 3] = 255;
      }
      liveCtx.putImageData(imgBufferData, 0, 0);

      const frameSnapshot = liveCtx.getImageData(0, 0, width, width);
      self.postMessage({
        type: "progress",
        progress: Math.floor((lineIdx / numLines) * 100),
        frame: frameSnapshot,
      });
    }
  }

  const finalBufferData = liveCtx.createImageData(width, width);
  for (let i = 0; i < imgResult.length; i++) {
    const pixelVal = Math.floor(imgResult[i] * 255);
    const idx = i * 4;
    finalBufferData.data[idx] = pixelVal;
    finalBufferData.data[idx + 1] = pixelVal;
    finalBufferData.data[idx + 2] = pixelVal;
    finalBufferData.data[idx + 3] = 255;
  }
  liveCtx.putImageData(finalBufferData, 0, 0);
  const finalImage = liveCtx.getImageData(0, 0, width, width);

  self.postMessage({
    type: "complete",
    frame: finalImage,
    executionTimeMs: performance.now() - startTime,
    result: {
      sequence: lines,
    },
  });
};
