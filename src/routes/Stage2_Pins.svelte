<script lang="ts">
  import { pipeline } from "../state/pipelineState.svelte";
  import { Slider } from "$lib/components/ui/slider";
  import { Spinner } from "$lib/components/ui/spinner";
  import * as Accordion from "$lib/components/ui/accordion";
  import type { PinGeneratorType } from "$lib/lib/pins/PinGeneratorType";

  $effect(() => {
    const count = pipeline.pinCount;
    const type = pipeline.pinGeneratorType;
    const voronoiIterations = pipeline.voronoiIterations;
    pipeline.generatePinGeometry();
  });

  function updateGeometryType(type: PinGeneratorType) {
    pipeline.pinGeneratorType = type;
  }

  function handleSliderChange(val: number) {
    pipeline.pinCount = val;
  }

  let width = $derived(pipeline.imageSize);
  let isDisabled = $derived(!pipeline.imageUrl || pipeline.isProcessingThreads);
  let imageOpacity = $state(0.25);
</script>

<div
  class="w-full flex flex-col gap-6 items-center justify-center max-w-md mx-auto"
>
  <div
    class="w-full aspect-square rounded-xl bg-zinc-950 relative shadow-2xl overflow-hidden shrink-0"
  >
    {#if pipeline.isProcessingPins}
      <div
        class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/20"
      >
        <Spinner data-testid="pin-generating-spinner" color="white" />
        <span
          class="mt-3 text-[9px] uppercase tracking-widest text-zinc-100 font-bold animate-pulse"
          >Generating</span
        >
        <div
          class="w-32 h-1 mt-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50"
        >
          <div
            class="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style="width: {pipeline.pinGenerationProgress || 0}%"
          ></div>
        </div>
      </div>
    {/if}

    {#if !pipeline.imageUrl}
      <div
        class="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-zinc-600 uppercase tracking-wider"
      >
        <span>Missing Image</span>
      </div>
    {:else}
      <img
        src={pipeline.imageUrl}
        alt="Tracing alignment guide"
        style="opacity: {imageOpacity};"
        class="absolute inset-0 w-full h-full pointer-events-none select-none transition-opacity duration-150 {pipeline.isLetterboxed
          ? 'object-contain'
          : 'object-cover'}"
      />
      {#if pipeline.pinLayout}
        <svg
          viewBox="0 0 {width} {width}"
          class="absolute inset-0 w-full h-full text-zinc-700 stroke-current fill-none z-10"
        >
          {#each pipeline.pinLayout.pins as pin (pin)}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={5}
              class="fill-zinc-400 stroke-none hover:fill-emerald-400 transition-all duration-500 ease-out"
            />
          {/each}
        </svg>
      {/if}
    {/if}
  </div>

  <div
    class="relative flex flex-col gap-4 w-full bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-4 font-mono shadow-xl transition-opacity {!pipeline.imageUrl
      ? 'opacity-50'
      : 'opacity-100'}"
  >
    <div class="w-full space-y-1">
      <div class="flex justify-between text-[9px] pb-2">
        <span class="text-zinc-500 uppercase tracking-wider font-bold"
          >Image Opacity</span
        >
        <span class="text-zinc-300 font-mono"
          >{Math.round(imageOpacity * 100)}%</span
        >
      </div>
      <Slider
        type={"single"}
        data-testid={`pin-image-opacity`}
        value={imageOpacity}
        min={0.1}
        max={1}
        step={0.05}
        disabled={!pipeline.imageUrl}
        onValueChange={(v) => (imageOpacity = v)}
        class="py-1 cursor-pointer"
      />
    </div>
    <div class="space-y-1.5">
      <span
        class="text-[9px] uppercase text-zinc-500 tracking-wider font-bold block"
        >Pin Layout</span
      >
      <div
        class="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80"
      >
        {#each ["circle", "square", "voronoi"] as type}
          <button
            type="button"
            data-testid={`pin-layout-${type}`}
            onclick={() => updateGeometryType(type as PinGeneratorType)}
            disabled={isDisabled}
            class="py-1.5 rounded-md text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 {pipeline.pinGeneratorType ===
            type
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'} {isDisabled
              ? 'cursor-not-allowed'
              : ''}"
          >
            {type}
          </button>
        {/each}
      </div>
    </div>

    <div class="space-y-2 pt-1">
      <div class="flex items-center justify-between text-[9px]">
        <span class="text-zinc-500 uppercase tracking-wider font-bold"
          >Pin Count</span
        >
        <span
          class="text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/40"
        >
          {pipeline.pinCount} Pins
        </span>
      </div>
      <Slider
        data-testid="pin-count-slider"
        type={"single"}
        value={pipeline.pinCount}
        min={40}
        max={1000}
        step={1}
        onValueChange={handleSliderChange}
        class="py-1 cursor-pointer"
        disabled={isDisabled}
      />
    </div>

    {#if pipeline.pinGeneratorType === "voronoi"}
      <Accordion.Root type="single" class="w-full pt-1">
        <Accordion.Item value="voronoi-settings" class="border-zinc-800/50">
          <Accordion.Trigger
            class="text-[9px] uppercase tracking-wider font-bold text-zinc-500 py-2 hover:no-underline"
            disabled={isDisabled}
          >
            Voronoi Settings
          </Accordion.Trigger>
          <Accordion.Content class="space-y-4 pt-2">
            <div class="space-y-1">
              <div class="flex justify-between text-[9px] pb-2">
                <span class="text-zinc-500 uppercase">Iterations</span>
                <span class="text-zinc-300"
                  >{pipeline.voronoiIterations || 10}</span
                >
              </div>
              <Slider
                data-testid="voronoi-iterations"
                type="single"
                value={pipeline.voronoiIterations}
                min={1}
                max={50}
                step={1}
                onValueChange={(v) => (pipeline.voronoiIterations = v)}
                disabled={isDisabled}
              />
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    {/if}
  </div>
</div>
