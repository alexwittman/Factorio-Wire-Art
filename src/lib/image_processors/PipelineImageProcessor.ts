import { IImageProcessor } from "./IImageProcessor";

export class PipelineImageProcessor implements IImageProcessor {
  private processors: IImageProcessor[];

  constructor(processors: IImageProcessor[]) {
    this.processors = processors;
  }

  process(image: Float32Array): Float32Array {
    let result = image;

    for (const processor of this.processors) {
      result = processor.process(result);
    }

    return result;
  }
}
