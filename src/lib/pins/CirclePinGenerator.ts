import { IPinGenerator } from "./IPinGenerator";
import { IPinLayout, IPoint2D } from "./IPinLayout";

export class CirclePinGenerator implements IPinGenerator {
  radius: number;

  constructor(radius: number) {
    this.radius = radius;
  }

  async *generate(
    count: number,
  ): AsyncGenerator<IPinLayout, IPinLayout, unknown> {
    const center = this.radius + 1;
    const pins: IPoint2D[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      pins.push({
        x: Math.floor(center + this.radius * Math.cos(angle)),
        y: Math.floor(center + this.radius * Math.sin(angle)),
      });
    }

    let adjacencies: number[][] = [];
    for (let i = 0; i < count; i++) {
      adjacencies[i] = [];
      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        adjacencies[i].push(j);
      }
    }

    const layout: IPinLayout = { pins, adjacencies };
    yield layout;
    return layout;
  }
}
