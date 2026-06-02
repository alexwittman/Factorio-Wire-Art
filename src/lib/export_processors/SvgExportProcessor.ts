import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "../threading/ThreadResult";
import { IExportProcessor } from "./IExportProcessor";

export class SvgExportProcessor implements IExportProcessor {
  imageSize: number;
  lineWidth: number;
  lineWeight: number;

  constructor(imageSize: number, lineWidth: number, lineWeight: number) {
    this.imageSize = imageSize;
    this.lineWeight = lineWeight;
    this.lineWidth = lineWidth;
  }

  export(result: ThreadResult, layout: IPinLayout): void {
    const paths = result.sequence
      .map(([startIdx, endIdx]) => {
        const start = layout.pins[startIdx];
        const end = layout.pins[endIdx];

        return `<path d="M ${start.x} ${start.y} L ${end.x} ${end.y}" 
                          stroke="black" 
                          stroke-width="${this.lineWidth}" 
                          stroke-opacity="${this.lineWeight * 1.75}" 
                          fill="none" />`;
      })
      .join("\n");

    const svgPayload = `<?xml version="1.0" standalone="no"?>
            <svg width="${this.imageSize}" height="${this.imageSize}" version="1.1" xmlns="http://www.w3.org/2000/svg">
            ${paths}
            </svg>`;

    this.triggerBlobDownload(svgPayload, "threaded.svg", "image/svg+xml");
  }

  triggerBlobDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
