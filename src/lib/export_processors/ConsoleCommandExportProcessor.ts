import { toast } from "svelte-sonner";
import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "../threading/ThreadResult";
import { IExportProcessor } from "./IExportProcessor";

export class ConsoleCommandExportProcessor implements IExportProcessor {
  constructor(
    private scale: number,
    private imageSize: number,
    private buildTime: number,
  ) {}

  private getConnectorIDs(color: string): number[] {
    const map: Record<string, number[]> = {
      red: [1],
      green: [2],
      blue: [5],
      white: [1, 2, 5],
    };
    return map[color] ?? [5];
  }

  private generateData(results: ThreadResult[], layout: IPinLayout): string {
    const pins = layout.pins.map((p) => ({
      x: (p.x / this.imageSize) * this.scale - this.scale / 2,
      y: (p.y / this.imageSize) * this.scale - this.scale / 2,
    }));

    const groups: { type: number; pairs: string[] }[] = [];
    results.forEach((res) => {
      this.getConnectorIDs(res.color).forEach((type) => {
        groups.push({
          type,
          pairs: res.sequence.map((s) => `{${s[0] + 1}, ${s[1] + 1}}`),
        });
      });
    });

    const maxPairs = Math.max(...groups.map((g) => g.pairs.length));
    const connections_per_tick =
      this.buildTime == 0
        ? maxPairs
        : Math.max(1, Math.ceil(maxPairs / (this.buildTime * 60)));

    return `{
      pins = {${pins.map((p) => `{x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)}}`).join(", ")}},
      connections_per_tick = ${connections_per_tick},
      groups = {${groups.map((g) => `{type=${g.type}, pairs={${g.pairs.join(", ")}}}`).join(", ")}}
    }`;
  }

  export(results: ThreadResult[], layout: IPinLayout): void {
    const command = `/build-wire-art ${this.generateData(results, layout).replace(/\s+/g, " ")}`;
    navigator.clipboard
      .writeText(command.trim())
      .then(() =>
        toast("Copied to Clipboard", {
          description: "Paste into the Factorio console and run to import.",
        }),
      )
      .catch((err) => console.error("Clipboard error:", err));
  }
}
