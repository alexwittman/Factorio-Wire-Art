export interface IImageProcessor {
  process: (image: Float32Array) => Float32Array;
}
