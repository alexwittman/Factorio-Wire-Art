import { ThreadColor } from "../threading/ThreadColorTheme";
import { IImageProcessor } from "./IImageProcessor";

export class RGBImageProcessor implements IImageProcessor {
  private channel: ThreadColor;

  constructor(channel: ThreadColor) {
    this.channel = channel;
  }

  process(image: Float32Array): Float32Array {
    const output = new Float32Array(image.length / 4);

    for (let i = 0; i < output.length; i++) {
      const rgbaIdx = i * 4;

      const r = image[rgbaIdx];
      const g = image[rgbaIdx + 1];
      const b = image[rgbaIdx + 2];

      switch (this.channel) {
        case "red":
          output[i] = r;
          break;
        case "green":
          output[i] = g;
          break;
        case "blue":
          output[i] = b;
          break;
      }
    }

    return output;
  }
}
