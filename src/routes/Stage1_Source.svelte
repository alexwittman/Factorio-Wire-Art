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
    class="w-full aspect-square rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center relative overflow-hidden shadow-inner"
  >
    {#if pipeline.imageUrl}
      <img
        src={pipeline.imageUrl}
        alt="Source target preview"
        class="w-full h-full object-cover"
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
      onchange={handleImageSelection}
    />
  </label>
</div>
