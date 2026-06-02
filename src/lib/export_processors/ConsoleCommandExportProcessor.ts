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

  export(result: ThreadResult, layout: IPinLayout): void {
    const pinPositions = layout.pins.map((p) => {
      const scaledX = (p.x / this.imageSize) * this.scale;
      const scaledY = (p.y / this.imageSize) * this.scale;
      const offset = this.scale / 2;
      return `{x = center.x + (${scaledX.toFixed(2)} - ${offset.toFixed(2)}), y = center.y + (${scaledY.toFixed(2)} - ${offset.toFixed(2)})}`;
    });

    const connections = result.sequence.map(([s, e]) => `{${s + 1}, ${e + 1}}`);

    const command = `/c 
            local surface = game.player.surface
            local center = game.player.position
            local pole_name = "wire-art-pin"
            local placed_poles = {}
            local pins = {${pinPositions.join(", ")}}
            
            for i, pos in ipairs(pins) do
                local pole = surface.create_entity{
                    name = pole_name, 
                    position = pos, 
                    force = game.player.force, 
                    create_build_effect_smoke = false
                }
                if pole then
                    pole.get_wire_connector(defines.wire_connector_id.pole_copper).disconnect_all()
                    table.insert(placed_poles, pole)
                end
            end
            
            local connections = {${connections.join(", ")}}
            for _, pair in ipairs(connections) do
                local p1 = placed_poles[pair[1]]
                local p2 = placed_poles[pair[2]]
                if p1 and p2 then
                    p1.get_wire_connector(defines.wire_connector_id.pole_copper).connect_to(
                        p2.get_wire_connector(defines.wire_connector_id.pole_copper), 
                        false
                    )
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
