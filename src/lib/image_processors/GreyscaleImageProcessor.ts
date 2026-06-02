import { IImageProcessor } from "./IImageProcessor";

export class GreyscaleImageProcessor implements IImageProcessor {
  process(image: Float32Array): Float32Array {
    const output = new Float32Array(image.length / 4);

    for (let i = 0; i < output.length; i++) {
      const rgbaIdx = i * 4;

      const r = image[rgbaIdx];
      const g = image[rgbaIdx + 1];
      const b = image[rgbaIdx + 2];

      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      output[i] = gray;
    }

    return output;
  }
}
