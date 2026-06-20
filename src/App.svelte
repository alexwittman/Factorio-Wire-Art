<script lang="ts">
  import Stage1Source from "./routes/Stage1_Source.svelte";
  import Stage2Pins from "./routes/Stage2_Pins.svelte";
  import Stage3Trace from "./routes/Stage3_Trace.svelte";
  import Stage4Export from "./routes/Stage4_Export.svelte";
  import * as Card from "$lib/components/ui/card";
  import { Toaster } from "svelte-sonner";
</script>

<main class="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
  <header
    class="h-14 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/50 justify-between"
  >
    <h1 class="text-sm font-bold uppercase tracking-widest text-emerald-500">
      Factorio Wire Art Generator
    </h1>

    <div class="flex items-center gap-6">
      <a
        href="https://www.youtube.com/watch?v=mGOKKtIDNbk"
        target="_blank"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs font-bold text-zinc-300 hover:text-white"
      >
        As seen on YouTube
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#FF0000"
        >
          <path
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
          />
        </svg>
      </a>

      <a
        href="https://www.youtube.com/@wittmanalex"
        target="_blank"
        class="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 hover:border-emerald-500 transition-colors"
        title="Visit YouTube Channel"
      >
        <img
          src="/logo.png"
          alt="Channel Avatar"
          class="w-full h-full object-cover"
        />
      </a>
    </div>
  </header>

  <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
    {#each [{ title: "1. Select Image", comp: Stage1Source }, { title: "2. Generate Poles", comp: Stage2Pins }, { title: "3. Run Optimization", comp: Stage3Trace }, { title: "4. Export", comp: Stage4Export }] as col}
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
