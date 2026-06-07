import { Delaunay } from "d3-delaunay";
import type { IPinLayout, IPoint2D } from "./IPinLayout";
import { IPinGenerator } from "./IPinGenerator";

export class VoronoiPinGenerator implements IPinGenerator {
  image: Float32Array;
  width: number;
  height: number;
  iterations: number = 30;
  pinRadius: number = 3;

  constructor(
    image: Float32Array,
    width: number,
    height: number,
    iterations: number,
    pinRadius: number,
  ) {
    this.image = image;
    this.width = width;
    this.height = height;
    this.iterations = iterations;
    this.pinRadius = pinRadius;
  }

  async *generate(
    count: number,
  ): AsyncGenerator<IPinLayout, IPinLayout, unknown> {
    let points = new Float64Array(count * 2);

    let found = 0;
    let attempts = 0;
    const maxAttempts = count * 5000;

    while (found < count && attempts < maxAttempts) {
      let x = Math.floor(Math.random() * this.width);
      let y = Math.floor(Math.random() * this.height);
      let brightness = this.getBrightness(x, y);
      if (brightness < 0.9 && Math.random() > brightness) {
        points[found * 2] = x;
        points[found * 2 + 1] = y;
        found++;
      }
      attempts++;
    }

    for (let iter = 0; iter < this.iterations; iter++) {
      const delaunay = new Delaunay(points);
      const centroidsX = new Float64Array(count);
      const centroidsY = new Float64Array(count);
      const weights = new Float64Array(count);

      let delaunayIndex = 0;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const brightness = this.getBrightness(x, y);
          const weight = 1.0 - brightness;
          delaunayIndex = delaunay.find(x, y, delaunayIndex);
          weights[delaunayIndex] += weight;
          centroidsX[delaunayIndex] += x * weight;
          centroidsY[delaunayIndex] += y * weight;
        }
      }

      for (let i = 0; i < count; i++) {
        if (weights[i] > 0) {
          points[i * 2] = centroidsX[i] / weights[i];
          points[i * 2 + 1] = centroidsY[i] / weights[i];
        }
      }
      yield this.createLayout(points);
    }

    return this.createLayout(points);
  }

  private getBrightness(x: number, y: number): number {
    return 1 - this.image[y * this.width + x];
  }

  private createLayout(points: Float64Array): IPinLayout {
    const pins: IPoint2D[] = [];
    for (let i = 0; i < points.length / 2; i++) {
      pins.push({ x: points[i * 2], y: points[i * 2 + 1] });
    }

    const adjacencies: number[][] = Array.from(
      { length: pins.length },
      () => [],
    );

    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        if (!this.isBlocked(pins[i], pins[j], pins, i, j, this.pinRadius)) {
          adjacencies[i].push(j);
          adjacencies[j].push(i);
        }
      }
    }

    return { pins, adjacencies };
  }

  private isBlocked(
    p1: IPoint2D,
    p2: IPoint2D,
    allPins: IPoint2D[],
    i: number,
    j: number,
    radius: number,
  ): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSq = dx * dx + dy * dy;

    for (let k = 0; k < allPins.length; k++) {
      if (k === i || k === j) continue;
      const p = allPins[k];
      let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / lengthSq;
      t = Math.max(0, Math.min(1, t));
      const closestX = p1.x + t * dx;
      const closestY = p1.y + t * dy;
      const distSq = (p.x - closestX) ** 2 + (p.y - closestY) ** 2;
      if (distSq < radius * radius) return true;
    }
    return false;
  }
}
