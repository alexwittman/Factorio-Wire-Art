import { toast } from "svelte-sonner";
import pako from "pako"; // npm install pako
import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "../threading/ThreadResult";
import { IExportProcessor } from "./IExportProcessor";

export class BlueprintExportProcessor implements IExportProcessor {
  scale: number;
  imageSize: number;
  name: string;
  onExport: (blueprint: string) => void;

  constructor(
    scale: number,
    imageSize: number,
    name: string,
    onExport: (blueprint: string) => void,
  ) {
    this.scale = scale;
    this.imageSize = imageSize;
    this.name = name;
    this.onExport = onExport;
  }

  export(results: ThreadResult[], layout: IPinLayout): void {
    const blueprint = this.generateBlueprint(results, layout);
    const jsonString = JSON.stringify(blueprint);
    const compressed = pako.deflate(jsonString);
    const base64 = btoa(String.fromCharCode(...compressed));
    const finalString = "0" + base64;

    this.onExport(finalString);
    navigator.clipboard.writeText(finalString).then(() => {
      toast("Copied to Clipboard", {
        description: "Import into Factorio as a blueprint.",
        class: "export-toast",
      });
    });
  }

  private generateBlueprint(results: ThreadResult[], layout: IPinLayout) {
    const entities = layout.pins.map((p, i) => ({
      entity_number: i + 1,
      name: "wire-art-pin",
      position: {
        x: (p.x / this.imageSize) * this.scale - this.scale / 2,
        y: (p.y / this.imageSize) * this.scale - this.scale / 2,
      },
    }));

    const wires: any[] = [];

    const getWireType = (color: string) => {
      return color === "red"
        ? [1]
        : color === "green"
          ? [2]
          : color === "blue"
            ? [5]
            : [1, 2, 5];
    };

    results.forEach((res) => {
      const wireTypes = getWireType(res.color);
      res.sequence.forEach((pair) => {
        wireTypes.forEach((wireId) => {
          wires.push([
            pair[0] + 1, // Source Entity Index
            wireId, // Source Connector ID
            pair[1] + 1, // Target Entity Index
            wireId, // Target Connector ID
          ]);
        });
      });
    });

    return {
      blueprint: {
        item: "blueprint",
        label: this.name,
        entities: entities,
        wires: wires,
      },
    };
  }
}
