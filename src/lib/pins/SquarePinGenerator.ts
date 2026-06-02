import { IPinLayout, IPoint2D } from "./IPinLayout";

export class SquarePinGenerator {
  length: number;

  constructor(length: number) {
    this.length = length;
  }

  async *generate(
    count: number,
  ): AsyncGenerator<IPinLayout, IPinLayout, unknown> {
    const pins: IPoint2D[] = [];
    const pinsPerSide = Math.floor(count / 4);
    const step = this.length / pinsPerSide;

    for (let i = 0; i < pinsPerSide; i++) pins.push({ x: i * step, y: 0 });
    for (let i = 0; i < pinsPerSide; i++)
      pins.push({ x: this.length, y: i * step });
    for (let i = 0; i < pinsPerSide; i++)
      pins.push({ x: this.length - i * step, y: this.length });
    for (let i = 0; i < pinsPerSide; i++)
      pins.push({ x: 0, y: this.length - i * step });

    const totalPins = pins.length;
    const adjacencies: number[][] = Array.from({ length: totalPins }, () => []);

    for (let i = 0; i < totalPins; i++) {
      const sideI = Math.floor(i / pinsPerSide);
      for (let j = 0; j < totalPins; j++) {
        if (i === j) continue;
        const sideJ = Math.floor(j / pinsPerSide);
        if (sideI !== sideJ) {
          adjacencies[i].push(j);
        }
      }
    }

    const layout: IPinLayout = { pins, adjacencies };
    yield layout;
    return layout;
  }
}
