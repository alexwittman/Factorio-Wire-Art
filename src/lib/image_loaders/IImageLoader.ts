export interface IImageLoader {
  load: (url: string, size: number) => Promise<Float32Array>;
}
