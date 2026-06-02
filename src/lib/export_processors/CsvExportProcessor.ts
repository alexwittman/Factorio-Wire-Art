import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "../threading/ThreadResult";
import { IExportProcessor } from "./IExportProcessor";

export class CsvExportProcessor implements IExportProcessor {
  export(result: ThreadResult, layout: IPinLayout): void {
    let pinPairsCsv = "index,start_pin_index,end_pin_index\n";
    result.sequence.forEach(([start, end], index) => {
      pinPairsCsv += `${index},${start},${end}\n`;
    });
    this.triggerBlobDownload(pinPairsCsv, "pin_pairs.csv", "text/csv");

    let pinCoordsCsv = "index,x,y\n";
    layout.pins.forEach((point, index) => {
      pinCoordsCsv += `${index},${point.x},${point.y}\n`;
    });
    this.triggerBlobDownload(pinCoordsCsv, "pin_coords.csv", "text/csv");
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
