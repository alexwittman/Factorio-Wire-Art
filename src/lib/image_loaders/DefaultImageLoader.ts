import { IImageLoader } from "./IImageLoader";

export class DefaultImageLoader implements IImageLoader {
  async load(url: string, size: number): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;

      img.onerror = () => reject(new Error(`Failed to load image at ${url}`));

      img.onload = () => {
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext("2d")!;

        const minEdge = Math.min(img.width, img.height);
        const left = (img.width - minEdge) / 2;
        const top = (img.height - minEdge) / 2;

        ctx.drawImage(img, left, top, minEdge, minEdge, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const rawData = imageData.data;

        const floatArray = new Float32Array(size * size * 4);

        for (let i = 0; i < rawData.length; i++) {
          floatArray[i] = rawData[i] / 255.0;
        }

        resolve(floatArray);
      };
    });
  }
}
