import { toast } from "svelte-sonner";
import { IPinLayout } from "../pins/IPinLayout";
import type { ThreadResult } from "../threading/ThreadResult";
import { IExportProcessor } from "./IExportProcessor";

export class ConsoleCommandExportProcessor implements IExportProcessor {
  private scale: number;
  private imageSize: number;

  constructor(scale: number, imageSize: number) {
    this.scale = scale;
    this.imageSize = imageSize;
  }

  private getConnectors(color: string): string[] {
    switch (color) {
      case "blue":
        return ["pole_copper"];
      case "green":
        return ["circuit_green"];
      case "red":
        return ["circuit_red"];
      case "white":
        return ["pole_copper", "circuit_green", "circuit_red"];
      default:
        return ["pole_copper"];
    }
  }

  export(results: ThreadResult[], layout: IPinLayout): void {
    const pinPositions = layout.pins.map((p) => {
      const scaledX = (p.x / this.imageSize) * this.scale;
      const scaledY = (p.y / this.imageSize) * this.scale;
      const offset = this.scale / 2;
      return `{x = center.x + (${scaledX.toFixed(2)} - ${offset.toFixed(2)}), y = center.y + (${scaledY.toFixed(2)} - ${offset.toFixed(2)})}`;
    });

    const connectionBlocks = results
      .flatMap((res) => {
        const connections = res.sequence.map(
          ([s, e]) => `{${s + 1}, ${e + 1}}`,
        );
        const connectors = this.getConnectors(res.color || "black");

        return connectors.map(
          (conn) =>
            `{connector = defines.wire_connector_id.${conn}, connections = {${connections.join(", ")}}}`,
        );
      })
      .join(", ");

    const command = `/c 
      local surface = game.player.surface
      local center = game.player.position
      local pole_name = "wire-art-pin"
      local placed_poles = {}
      local pins = {${pinPositions.join(", ")}}
      
      for i, pos in ipairs(pins) do
          local pole = surface.create_entity{
              name = pole_name, position = pos, force = game.player.force, create_build_effect_smoke = false
          }
          if pole then
              table.insert(placed_poles, pole)
          end
      end
      
      local groups = {${connectionBlocks}}
      for _, group in ipairs(groups) do
          local wire_type = group.connector
          for _, pair in ipairs(group.connections) do
              local p1 = placed_poles[pair[1]]
              local p2 = placed_poles[pair[2]]
              if p1 and p2 then
                  p1.get_wire_connector(wire_type, true).connect_to(p2.get_wire_connector(wire_type, true), false)
              end
          end
      end`.replace(/\s+/g, " ");

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
