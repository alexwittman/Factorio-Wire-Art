import { ThreadColor } from "../threading/ThreadColorTheme";
import { ILiveFrameProcessor } from "./ILiveFrameProcessor";
import type { LiveFrame } from "./LiveFrame";

export class RecolorLiveFrameProcessor implements ILiveFrameProcessor {
  color: ThreadColor;

  constructor(color: ThreadColor) {
    this.color = color;
  }

  process(frames: LiveFrame[]): void {
    const frame = frames.find((f) => f.color === this.color);
    if (!frame) {
      throw new Error(`No frame found for color: ${this.color}`);
    }

    const data = frame.data.data;

    for (let i = 0; i < data.length; i += 4) {
      const intensity = 255 - data[i];

      switch (this.color) {
        case "red":
          data[i] = intensity;
          data[i + 1] = 0;
          data[i + 2] = 0;
          break;
        case "green":
          data[i] = 0;
          data[i + 1] = intensity;
          data[i + 2] = 0;
          break;
        case "blue":
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = intensity;
          break;
        case "white":
          data[i] = intensity;
          data[i + 1] = intensity;
          data[i + 2] = intensity;
          break;
        default:
          break;
      }
    }
  }
}
