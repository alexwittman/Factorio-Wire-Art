import { IImageProcessor } from "./IImageProcessor";

export class InversionImageProcessor implements IImageProcessor {
  process(image: Float32Array): Float32Array {
    const output = new Float32Array(image.length);

    for (let i = 0; i < image.length; i += 4) {
      output[i] = 1.0 - image[i];
      output[i + 1] = 1.0 - image[i + 1];
      output[i + 2] = 1.0 - image[i + 2];

      output[i + 3] = image[i + 3];
    }

    return output;
  }
}
