import { ILiveFrameProcessor } from "./ILiveFrameProcessor";
import type { LiveFrame } from "./LiveFrame";

export class RGBCompositeFrameProcessor implements ILiveFrameProcessor {
  process(frames: LiveFrame[]): void {
    const targetFrame = frames.find((f) => f.color === "white");
    const rFrame = frames.find((f) => f.color === "red");
    const gFrame = frames.find((f) => f.color === "green");
    const bFrame = frames.find((f) => f.color === "blue");

    if (!targetFrame || !rFrame || !gFrame || !bFrame) return;

    const target = targetFrame.data.data;
    const rData = rFrame.data.data;
    const gData = gFrame.data.data;
    const bData = bFrame.data.data;

    for (let i = 0; i < target.length; i += 4) {
      target[i] = rData[i];
      target[i + 1] = gData[i + 1];
      target[i + 2] = bData[i + 2];
      target[i + 3] = 255;
    }
  }
}
