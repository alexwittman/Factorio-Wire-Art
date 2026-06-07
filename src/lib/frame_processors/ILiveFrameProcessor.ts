import type { LiveFrame } from "./LiveFrame";

export interface ILiveFrameProcessor {
  process: (frames: LiveFrame[]) => void;
}
