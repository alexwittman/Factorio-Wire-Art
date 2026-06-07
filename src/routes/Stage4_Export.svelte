<script lang="ts">
  import { pipeline } from "../state/pipelineState.svelte";
  import { Slider } from "$lib/components/ui/slider";
  import type { ExportType } from "$lib/lib/export_processors/ExportType";

  function exportThreads(type: ExportType, scale: number = 1) {
    pipeline.export(type, scale);
  }

  let modAcknowledged = $state(false);
  let exportScale = $state(32);
  let blueprintError = $derived(
    pipeline.threadStats &&
      (pipeline.threadStats!.longestThreadLength / pipeline.imageSize) *
        exportScale >=
        64,
  );
</script>

<div class="w-full flex flex-col gap-6">
  <div class="flex flex-col gap-1">
    <h3
      class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1"
    >
      Factorio
    </h3>
    <label
      class="flex items-center justify-between p-3 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 w-full transition-all cursor-pointer group hover:bg-amber-500/20"
    >
      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          bind:checked={modAcknowledged}
          class="accent-amber-500 w-4 h-4"
        />
        <div class="flex flex-col">
          <span
            class="text-[10px] font-bold text-amber-500 flex items-center gap-1.5 uppercase"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Mod required before importing to factorio
          </span>
          <span class="text-[9px] text-amber-500/70 font-mono">
            I acknowledge I have installed the wire art mod in Factorio.
          </span>
        </div>
      </div>

      <a
        href="https://example.com/install"
        target="_blank"
        rel="noopener noreferrer"
        class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold uppercase rounded shadow-sm transition-colors pointer-events-auto shrink-0"
      >
        Install
      </a>
    </label>

    <div class="space-y-2 pt-1">
      <div class="flex items-center justify-between text-[9px]">
        <span class="text-zinc-500 uppercase tracking-wider font-bold">
          Scale Configuration
        </span>
        <span
          class="text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/40"
        >
          {exportScale} Tiles
        </span>
      </div>

      <Slider
        type={"single"}
        value={exportScale}
        min={8}
        max={128}
        step={1}
        onValueChange={(v) => (exportScale = v)}
        class="py-1 {!modAcknowledged
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer'}"
        disabled={!modAcknowledged}
      />
    </div>

    <button
      type="button"
      disabled={!pipeline.threadResults || !modAcknowledged || blueprintError}
      class="w-full flex flex-col items-start p-3 rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
    >
      <span
        class="text-[11px] font-bold font-mono tracking-wider text-zinc-200 uppercase"
      >
        Blueprint String
      </span>
      <span class="text-[10px] text-zinc-500"
        >Import this string into Factorio to place as a blueprint.</span
      >
      {#if blueprintError}
        <span class="text-[10px] text-red-500"
          >Longest wire exceeds Factorio maximum length of 64 tiles, so
          blueprint will not work.</span
        >
        <span class="text-[10px] text-red-500"
          >Reduce the scale or use the cosole command option instead.</span
        >
      {/if}
    </button>

    <button
      type="button"
      onclick={() => exportThreads("console-command", exportScale)}
      disabled={!pipeline.threadResults || !modAcknowledged}
      class="w-full flex flex-col items-start p-3 rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
    >
      <span
        class="text-[11px] font-bold font-mono tracking-wider text-zinc-200 uppercase"
      >
        Console Command
      </span>
      <span class="text-[10px] text-zinc-500"
        >Paste into the console and run this command to place the wire art at
        your current position.</span
      >
    </button>
  </div>
  <div class="flex flex-col gap-1">
    <h3
      class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1"
    >
      Other
    </h3>

    <button
      type="button"
      onclick={() => exportThreads("csv")}
      disabled={!pipeline.threadResults}
      class="w-full flex flex-col items-start p-3 rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
    >
      <span
        class="text-[11px] font-bold font-mono tracking-wider text-zinc-200 uppercase"
      >
        CSV Data
      </span>
      <span class="text-[10px] text-zinc-500"
        >Pin coordinates and wire connections in separate files.</span
      >
    </button>
  </div>
</div>
