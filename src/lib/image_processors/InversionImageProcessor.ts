import { IImageProcessor } from "./IImageProcessor";

export class InversionImageProcessor implements IImageProcessor {
  process(image: Float32Array): Float32Array {
    const output = new Float32Array(image.length);

    for (let i = 0; i < image.length; i++) {
      output[i] = 1.0 - image[i];
    }

    return output;
  }
}
