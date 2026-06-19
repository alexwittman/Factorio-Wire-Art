<script lang="ts">
  import Stage1Source from "./routes/Stage1_Source.svelte";
  import Stage2Pins from "./routes/Stage2_Pins.svelte";
  import Stage3Trace from "./routes/Stage3_Trace.svelte";
  import Stage4Export from "./routes/Stage4_Export.svelte";
  import * as Card from "$lib/components/ui/card";
  import { Toaster } from "svelte-sonner";
</script>

<main class="lg:h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
  <header
    class="h-14 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/50"
  >
    <h1 class="text-sm font-bold uppercase tracking-widest text-emerald-500">
      Factorio Wire Art Generator
    </h1>
  </header>

  <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
    {#each [{ title: "1. Select Image", comp: Stage1Source }, { title: "2. Generate Pins", comp: Stage2Pins }, { title: "3. Run Optimization", comp: Stage3Trace }, { title: "4. Export", comp: Stage4Export }] as col}
      <section class="flex flex-col gap-2">
        <h2
          class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1"
        >
          {col.title}
        </h2>

        <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <Card.Root class="bg-zinc-900 border-zinc-800 p-4">
            <svelte:component this={col.comp} />
          </Card.Root>
        </div>
      </section>
    {/each}
  </div>
  <Toaster
    position="bottom-center"
    richColors
    theme="dark"
    toastOptions={{
      style: "background: #18181b; border: 1px solid #27272a; color: #f4f4f5;",
      class: "my-toast-class",
    }}
  />
</main>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3f3f46;
  }
</style>
