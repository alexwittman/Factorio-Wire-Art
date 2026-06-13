<script lang="ts">
  import { pipeline } from "../state/pipelineState.svelte";

  async function handleImageSelection(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (pipeline.imageUrl) {
      URL.revokeObjectURL(pipeline.imageUrl);
    }

    let imageUrl = URL.createObjectURL(file);

    pipeline.setImageUrl(imageUrl);
  }
</script>

<div class="flex flex-col gap-4 w-full max-w-md">
  <div
    class="w-full aspect-square rounded-xl bg-zinc-950 flex items-center justify-center relative overflow-hidden shadow-inner"
  >
    {#if pipeline.imageUrl}
      <img
        src={pipeline.imageUrl}
        alt="Source target preview"
        class="w-full h-full {pipeline.isLetterboxed
          ? 'object-contain'
          : 'object-cover'}"
      />
    {:else}
      <div class="text-zinc-700 text-xs font-mono uppercase tracking-widest">
        No Image Selected
      </div>
    {/if}
  </div>

  <label
    class="w-full py-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 group"
  >
    <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
      {pipeline.imageUrl ? "Swap Image" : "Select Image"}
    </span>
    <input
      type="file"
      accept="image/*"
      class="hidden"
      disabled={pipeline.isProcessingPins || pipeline.isProcessingThreads}
      onchange={handleImageSelection}
    />
  </label>

  <div
    class="relative flex flex-col gap-4 w-full bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-4 font-mono shadow-xl transition-opacity {!pipeline.imageUrl
      ? 'opacity-50'
      : 'opacity-100'}"
  >
    <div class="space-y-1.5">
      <span
        class="text-[9px] uppercase text-zinc-500 tracking-wider font-bold block"
        >Crop Style</span
      >
      <div
        class="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80"
      >
        {#each [{ letterboxed: false, name: "Cropped" }, { letterboxed: true, name: "Letterboxed" }] as type}
          <button
            type="button"
            data-testid={`crop-style-${type.letterboxed}`}
            onclick={() => (pipeline.isLetterboxed = type.letterboxed)}
            disabled={pipeline.isProcessingPins || pipeline.isProcessingThreads}
            class="py-1.5 rounded-md text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 {pipeline.isLetterboxed ===
            type.letterboxed
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'} {pipeline.isProcessingPins ||
            pipeline.isProcessingThreads
              ? 'cursor-not-allowed'
              : ''}"
          >
            {type.name}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
