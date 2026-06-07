import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "../threading/ThreadResult";
import { IExportProcessor } from "./IExportProcessor";
import JSZip from "jszip";

export class CsvExportProcessor implements IExportProcessor {
  imageSize: number;

  constructor(imageSize: number) {
    this.imageSize = imageSize;
  }

  async export(results: ThreadResult[], layout: IPinLayout): Promise<void> {
    const zip = new JSZip();

    let pinCoordsCsv = "index,x,y\n";
    layout.pins.forEach((point, index) => {
      pinCoordsCsv += `${index},${point.x / this.imageSize},${point.y / this.imageSize}\n`;
    });
    zip.file("pin_coords.csv", pinCoordsCsv);

    results.forEach((result) => {
      let pinPairsCsv = "index,start_pin_index,end_pin_index\n";
      result.sequence.forEach(([start, end], index) => {
        pinPairsCsv += `${index},${start},${end}\n`;
      });

      const fileName = `pin_pairs_${result.color}.csv`;
      zip.file(fileName, pinPairsCsv);
    });

    const content = await zip.generateAsync({ type: "blob" });
    this.triggerBlobDownload(content, "threaded_data.zip");
  }

  triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
