import { PipelineImageProcessor } from "$lib/lib/image_processors/PipelineImageProcessor";
import { InversionImageProcessor } from "$lib/lib/image_processors/InversionImageProcessor";
import { GreyscaleImageProcessor } from "$lib/lib/image_processors/GreyscaleImageProcessor";
import { DefaultImageLoader } from "$lib/lib/image_loaders/DefaultImageLoader";
import { IPinLayout } from "$lib/lib/pins/IPinLayout";
import { SquarePinGenerator } from "$lib/lib/pins/SquarePinGenerator";
import { CirclePinGenerator } from "$lib/lib/pins/CirclePinGenerator";
import type { PinGeneratorType } from "$lib/lib/pins/PinGeneratorType";
import { VoronoiPinGenerator } from "$lib/lib/pins/VoronoiPinGenerator";
import type { ThreadResult } from "$lib/lib/threading/ThreadResult";
import type { ThreadStats } from "$lib/lib/threading/ThreadStats";
import { ThreadResultProcessor } from "$lib/lib/threading/ThreadResultProcessor";
import type { ExportType } from "$lib/lib/export_processors/ExportType";
import { SvgExportProcessor } from "$lib/lib/export_processors/SvgExportProcessor";
import { CsvExportProcessor } from "$lib/lib/export_processors/CsvExportProcessor";
import { ConsoleCommandExportProcessor } from "$lib/lib/export_processors/ConsoleCommandExportProcessor";
import type { ThreadColorTheme } from "$lib/lib/threading/ThreadColorTheme";

class UnifiedOrchestratorState {
  imageUrl = $state("");
  imageSize = 1001;

  latestRequestId = 0;
  isProcessingPins = $state(false);
  pinGeneratorType = $state("circle" as PinGeneratorType);
  pinLayout: IPinLayout | null = $state(null);
  pinCount = $state(250);
  voronoiIterations = $state(30);
  voronoiPinRadius = $state(3);
  // TODO: Click to enable/disable pin. Add enabled list to pin layout and toggle

  isProcessingThreads = $state(false);
  threadingProgress = $state(0);
  liveFrame: ImageData | null = $state(null);
  threadResult: ThreadResult | null = $state(null);
  threadStats: ThreadStats | null = $state(null);
  threadColorTheme: ThreadColorTheme = $state("bw");

  config = $state({
    numLines: 3000,
    minLoop: 3,
    lineWeight: 0.3,
    lineWidth: 1,
    minScoreThreshold: 0.1,
  });

  private worker: Worker | null = null;

  async setImageUrl(url: string) {
    this.imageUrl = url;
    this.threadResult = null;
    this.threadStats = null;
    this.liveFrame = null;
  }

  async getPinGenerator() {
    switch (this.pinGeneratorType) {
      case "circle":
        return new CirclePinGenerator((this.imageSize - 1) / 2);
      case "square":
        return new SquarePinGenerator(this.imageSize);
      case "voronoi": {
        let image = await new DefaultImageLoader().load(
          this.imageUrl,
          this.imageSize,
        );
        image = new GreyscaleImageProcessor().process(image);
        return new VoronoiPinGenerator(
          image,
          this.imageSize,
          this.imageSize,
          this.voronoiIterations,
          this.voronoiPinRadius,
        );
      }
      default:
        return new CirclePinGenerator((this.imageSize - 1) / 2);
    }
  }

  async generatePinGeometry() {
    if (!this.imageUrl) return;

    const requestId = ++this.latestRequestId;

    this.pinLayout = null;
    this.liveFrame = null;
    this.threadResult = null;
    this.threadStats = null;

    let pinGenerator = await this.getPinGenerator();
    this.isProcessingPins = true;

    try {
      const generator = pinGenerator.generate(this.pinCount);

      for await (const pinLayout of generator) {
        if (requestId !== this.latestRequestId) {
          return;
        }

        this.pinLayout = pinLayout;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      this.isProcessingPins = false;
    } catch (error) {
      if (requestId === this.latestRequestId) {
        this.isProcessingPins = false;
      }
    }
  }

  runTraceOptimization() {
    if (!this.imageUrl || !this.pinLayout) return;

    this.threadResult = null;
    this.threadStats = null;
    this.isProcessingThreads = true;
    this.threadingProgress = 0;
    this.liveFrame = null;

    new DefaultImageLoader()
      .load(this.imageUrl, this.imageSize)
      .then((image) => {
        let imageProcessor = new PipelineImageProcessor([
          new GreyscaleImageProcessor(),
          new InversionImageProcessor(),
        ]);
        image = imageProcessor.process(image);

        this.worker = new Worker(
          new URL("../workers/traceEngine.worker.ts", import.meta.url),
          { type: "module" },
        );

        this.worker.postMessage({
          matrix: image,
          width: this.imageSize,
          pins: $state.snapshot(this.pinLayout!.pins),
          adjacencies: $state.snapshot(this.pinLayout!.adjacencies),
          config: $state.snapshot(this.config),
        });

        this.worker.onmessage = (e) => {
          const { type, progress, frame, result, executionTimeMs } = e.data;

          if (frame) this.liveFrame = frame;

          if (type === "progress") {
            this.threadingProgress = progress;
          } else if (type === "complete") {
            this.threadResult = result as ThreadResult;
            this.threadStats = new ThreadResultProcessor().getStats(
              this.threadResult,
              this.pinLayout!,
              executionTimeMs,
            );
            this.isProcessingThreads = false;
            this.threadingProgress = 100;
            this.worker?.terminate();
          }
        };
      });
  }

  export(type: ExportType, scale: number) {
    switch (type) {
      case "svg":
        return new SvgExportProcessor(
          this.imageSize,
          this.config.lineWidth,
          this.config.lineWeight,
        ).export(this.threadResult!, this.pinLayout!);
      case "csv":
        return new CsvExportProcessor().export(
          this.threadResult!,
          this.pinLayout!,
        );
      case "console-command":
        return new ConsoleCommandExportProcessor(scale, this.imageSize).export(
          this.threadResult!,
          this.pinLayout!,
        );
      default:
        return;
    }
  }
}

export const pipeline = new UnifiedOrchestratorState();
