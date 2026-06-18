<script lang="ts">
  import { pipeline } from "../state/pipelineState.svelte";
  import { Slider } from "$lib/components/ui/slider";
  import { Spinner } from "$lib/components/ui/spinner";
  import * as Accordion from "$lib/components/ui/accordion";
  import type { ThreadColorTheme } from "$lib/lib/threading/ThreadColorTheme";

  let canvasElements: (HTMLCanvasElement | null)[] = $state([]);

  let isDisabled = $derived(
    !pipeline.imageUrl ||
      !pipeline.pinLayout ||
      pipeline.isProcessingThreads ||
      pipeline.isProcessingPins,
  );

  function updateThreadColorTheme(type: ThreadColorTheme) {
    pipeline.threadColorTheme = type;
  }

  $effect(() => {
    pipeline.liveFrames.forEach((frame, i) => {
      const canvas = canvasElements[i];
      if (canvas && frame.data) {
        const ctx = canvas.getContext("2d", { alpha: false })!;
        if (canvas.width !== frame.data.width) {
          canvas.width = frame.data.width;
          canvas.height = frame.data.height;
        }
        ctx.putImageData(frame.data, 0, 0);
      }
    });
  });

  function handleLinesChange(val: number) {
    pipeline.config.numLines = val;
  }
  function handleWeightChange(val: number) {
    pipeline.config.lineWeight = val;
  }
  function handleWidthChange(val: number) {
    pipeline.config.lineWidth = val;
  }
</script>

<div
  class="w-full flex flex-col gap-6 items-center justify-center max-w-md mx-auto"
>
  <div
    class="w-full aspect-square rounded-xl bg-zinc-950 relative overflow-hidden shadow-2xl shrink-0 flex flex-wrap gap-2 p-2"
  >
    {#if pipeline.isProcessingThreads}
      <div
        class="absolute inset-0 z-50 flex flex-col items-center justify-center"
      >
        <Spinner
          data-testid="wire-generating-spinner"
          color="white"
          class="opacity-0"
        />
      </div>
    {/if}

    {#if !pipeline.isProcessingThreads && pipeline.liveFrames.length === 0}
      <div
        class="w-full h-full flex flex-col items-center justify-center text-center space-y-1.5 text-zinc-600 font-mono text-[11px] uppercase tracking-wider"
      >
        {#if !pipeline.imageUrl}
          <span>Missing Image</span>
        {:else if pipeline.isProcessingPins || !pipeline.pinLayout}
          <span>Waiting for pins...</span>
        {:else}
          <span>Ready to generate...</span>
        {/if}
      </div>
    {:else}
      {#each pipeline.liveFrames as _, i}
        <div
          class="flex-1 min-w-[45%] aspect-square rounded-lg relative overflow-hidden shadow-lg"
        >
          <canvas
            bind:this={canvasElements[i]}
            class="w-full h-full object-contain"
          ></canvas>
        </div>
      {/each}
    {/if}
  </div>

  <div
    class="flex flex-col gap-4 w-full bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-4 font-mono shadow-xl backdrop-blur-sm transition-opacity {isDisabled &&
    !pipeline.isProcessingThreads
      ? 'opacity-50'
      : 'opacity-100'}"
  >
    <div class="space-y-1.5">
      <span
        class="text-[9px] uppercase text-zinc-500 tracking-wider font-bold block"
        >Color Theme</span
      >
      <div
        class="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80"
      >
        {#each [{ id: "w", name: "Monochrome" }, { id: "rgb", name: "Color" }] as type}
          <button
            type="button"
            data-testid={`wire-theme-${type.id}`}
            onclick={() => updateThreadColorTheme(type.id as ThreadColorTheme)}
            disabled={isDisabled}
            class="py-1.5 rounded-md text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 {pipeline.threadColorTheme ===
            type.id
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'} {isDisabled
              ? 'cursor-not-allowed'
              : ''}"
          >
            {type.name}
          </button>
        {/each}
      </div>
    </div>
    <div class="space-y-2">
      <div class="flex items-center justify-between text-[9px]">
        <span class="text-zinc-500 uppercase tracking-wider font-bold"
          >Target Line Count</span
        >
        <span
          class="text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/40"
        >
          {pipeline.config.numLines || 2000} Lines
        </span>
      </div>
      <Slider
        type={"single"}
        data-testid="wire-count-slider"
        value={pipeline.config.numLines || 2000}
        min={1000}
        max={25000}
        step={100}
        disabled={isDisabled}
        onValueChange={handleLinesChange}
        class="py-1"
      />
    </div>

    <Accordion.Root type="single" class="w-full">
      <Accordion.Item value="advanced" class="border-none">
        <Accordion.Trigger
          class="text-[10px] text-zinc-400 uppercase tracking-wider hover:no-underline"
          disabled={isDisabled}
        >
          Advanced Settings
        </Accordion.Trigger>
        <Accordion.Content class="space-y-4 pt-2">
          <div class="space-y-1">
            <div class="flex justify-between text-[9px]">
              <span class="text-zinc-500 uppercase">Line Weight</span>
              <span class="text-zinc-300"
                >{pipeline.config.lineWeight || 0.05}</span
              >
            </div>
            <Slider
              type={"single"}
              data-testid="wire-weight-slider"
              value={pipeline.config.lineWeight || 0.05}
              min={0.01}
              max={1}
              step={0.01}
              disabled={isDisabled}
              onValueChange={handleWeightChange}
            />
          </div>
          <div class="space-y-1">
            <div class="flex justify-between text-[9px]">
              <span class="text-zinc-500 uppercase">Line Width</span>
              <span class="text-zinc-300"
                >{pipeline.config.lineWidth || 3}px</span
              >
            </div>
            <Slider
              type={"single"}
              data-testid="wire-width-slider"
              value={pipeline.config.lineWidth || 3}
              min={1}
              max={10}
              step={1}
              disabled={isDisabled}
              onValueChange={handleWidthChange}
            />
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>

    <div class="pt-2 border-t border-zinc-900 space-y-2">
      <button
        type="button"
        data-testid="generate-wires"
        disabled={isDisabled}
        onclick={() => pipeline.runTraceOptimization()}
        class="relative w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 border overflow-hidden {isDisabled
          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          : pipeline.isProcessingThreads
            ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
            : 'bg-emerald-500 hover:bg-emerald-400'}"
      >
        {#if pipeline.isProcessingThreads}
          <div
            class="absolute inset-0 bg-emerald-900/30"
            style="width: {pipeline.threadingProgress}%"
          ></div>
          <span class="relative z-10 flex items-center gap-2">
            <Spinner />
            {Math.round(
              (pipeline.threadingProgress / 100) *
                (pipeline.config.numLines || 0),
            )} / {pipeline.config.numLines}
          </span>
        {:else}
          {pipeline.threadResults ? "Regenerate" : "Generate"}
        {/if}
      </button>
    </div>

    {#if pipeline.threadStats}
      <div class="font-mono border-b border-zinc-900 pb-2">
        <p class="text-xs text-emerald-400 font-bold mt-0.5 mb-2">SUCCESS</p>

        <div class="grid grid-cols-3 gap-2 text-[9px] text-zinc-400">
          <div class="space-y-1">
            <p class="block">Total Wires</p>
            <span class="text-zinc-200 font-bold block"
              >{pipeline.threadStats?.totalThreads.toLocaleString()}</span
            >
            <p class="block mt-2">Execution Time</p>
            <span class="text-zinc-200 font-bold block"
              >{((pipeline.threadStats?.executionTimeMs || 0) / 1000).toFixed(
                2,
              )}s</span
            >
          </div>

          <div class="space-y-1">
            <p class="block">Pin Avg Wires</p>
            <span class="text-zinc-200 font-bold block"
              >{pipeline.threadStats?.pinAvgThreadCount.toFixed(2)}</span
            >
            <p class="block">Pin Max Wires</p>
            <span class="text-zinc-200 font-bold block"
              >{pipeline.threadStats?.pinMaxThreadCount}</span
            >
            <p class="block">Pin Min Wires</p>
            <span class="text-zinc-200 font-bold block"
              >{pipeline.threadStats?.pinMinThreadCount}</span
            >
          </div>

          <div class="space-y-1">
            <p class="block">Longest Wire</p>
            <span class="text-zinc-200 font-bold block"
              >{Math.round(
                pipeline.threadStats?.longestThreadLength || 0,
              ).toLocaleString()}px</span
            >
            <p class="block">Shortest Wire</p>
            <span class="text-zinc-200 font-bold block"
              >{Math.round(
                pipeline.threadStats?.shortestThreadLength || 0,
              ).toLocaleString()}px</span
            >
            <p class="block">Total Wire Length</p>
            <span class="text-zinc-200 font-bold block"
              >{Math.round(
                pipeline.threadStats?.totalThreadLength || 0,
              ).toLocaleString()}px</span
            >
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
