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
import type {
  ExportOptions,
  ExportType,
} from "$lib/lib/export_processors/ExportType";
import { CsvExportProcessor } from "$lib/lib/export_processors/CsvExportProcessor";
import { ConsoleCommandExportProcessor } from "$lib/lib/export_processors/ConsoleCommandExportProcessor";
import type {
  ThreadColor,
  ThreadColorTheme,
} from "$lib/lib/threading/ThreadColorTheme";
import { IImageProcessor } from "$lib/lib/image_processors/IImageProcessor";
import type { LiveFrame } from "$lib/lib/frame_processors/LiveFrame";
import { ILiveFrameProcessor } from "$lib/lib/frame_processors/ILiveFrameProcessor";
import { RGBCompositeFrameProcessor } from "$lib/lib/frame_processors/RGBCompositeFrameProcessor";
import { RecolorLiveFrameProcessor } from "$lib/lib/frame_processors/RecolorLiveFrameProcessor";
import { RGBImageProcessor } from "$lib/lib/image_processors/RGBImageProcessor";
import { BlueprintExportProcessor } from "$lib/lib/export_processors/BlueprintExportProcessor";

class UnifiedOrchestratorState {
  imageUrl = $state("");
  imageSize = 1001;
  isLetterboxed = $state(false);

  latestRequestId = 0;
  isProcessingPins = $state(false);
  pinGeneratorType = $state("circle" as PinGeneratorType);
  pinLayout: IPinLayout | null = $state(null);
  pinCount = $state(250);
  voronoiIterations = $state(30);
  pinGenerationProgress = $state(0);
  // TODO: Click to enable/disable pin. Add enabled list to pin layout and toggle

  isProcessingThreads = $state(false);
  threadingProgress = $state(0);
  liveFrames: LiveFrame[] = $state([]);
  threadResults: ThreadResult[] | null = $state(null);
  threadStats: ThreadStats | null = $state(null);
  threadColorTheme: ThreadColorTheme = $state("w");

  config = $state({
    numLines: 3000,
    minLoop: 3,
    lineWeight: 0.3,
    lineWidth: 1,
    minScoreThreshold: 0.1,
  });

  async setImageUrl(url: string) {
    this.imageUrl = url;
    this.threadResults = null;
    this.threadStats = null;
    this.liveFrames = [];
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
          this.isLetterboxed,
        );
        image = new GreyscaleImageProcessor().process(image);
        return new VoronoiPinGenerator(
          image,
          this.imageSize,
          this.imageSize,
          this.voronoiIterations,
          0,
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
    this.liveFrames = [];
    this.threadResults = null;
    this.threadStats = null;
    this.pinGenerationProgress = 0;

    let pinGenerator = await this.getPinGenerator();
    let totalIterations =
      this.pinGeneratorType === "voronoi" ? this.voronoiIterations : 1;
    this.isProcessingPins = true;

    try {
      const generator = pinGenerator.generate(this.pinCount);
      let iteration = 1;

      for await (const pinLayout of generator) {
        if (requestId !== this.latestRequestId) {
          return;
        }

        this.pinLayout = pinLayout;
        this.pinGenerationProgress = (iteration++ / totalIterations) * 100;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      this.isProcessingPins = false;
    } catch (error) {
      if (requestId === this.latestRequestId) {
        this.isProcessingPins = false;
      }
    }
  }

  getWorkerConfigs(): {
    imageProcessor: IImageProcessor;
    color: ThreadColor;
    frameProcessor: ILiveFrameProcessor;
  }[] {
    switch (this.threadColorTheme) {
      case "rgb":
        return [
          {
            imageProcessor: new PipelineImageProcessor([
              new RGBImageProcessor("red"),
            ]),
            color: "red",
            frameProcessor: new RecolorLiveFrameProcessor("red"),
          },
          {
            imageProcessor: new PipelineImageProcessor([
              new RGBImageProcessor("green"),
            ]),
            color: "green",
            frameProcessor: new RecolorLiveFrameProcessor("green"),
          },
          {
            imageProcessor: new PipelineImageProcessor([
              new RGBImageProcessor("blue"),
            ]),
            color: "blue",
            frameProcessor: new RecolorLiveFrameProcessor("blue"),
          },
          {
            imageProcessor: new PipelineImageProcessor([
              new GreyscaleImageProcessor(),
              new InversionImageProcessor(),
            ]),
            color: "white",
            frameProcessor: new RGBCompositeFrameProcessor(),
          },
        ];
      case "w":
        return [
          {
            imageProcessor: new PipelineImageProcessor([
              new GreyscaleImageProcessor(),
            ]),
            color: "white",
            frameProcessor: new RecolorLiveFrameProcessor("white"),
          },
        ];
    }
  }

  runTraceOptimization() {
    if (!this.imageUrl || !this.pinLayout) return;

    this.threadResults = [];
    this.threadStats = null;
    this.isProcessingThreads = true;
    this.threadingProgress = 0;
    let workerConfigs = this.getWorkerConfigs();
    let workerStatuses = Object.fromEntries(
      workerConfigs.map((config) => [
        config.color,
        { running: true, progress: 0 },
      ]),
    );
    this.liveFrames = workerConfigs.map((c) => {
      return {
        color: c.color,
        data: new ImageData(this.imageSize, this.imageSize),
      };
    });

    new DefaultImageLoader()
      .load(this.imageUrl, this.imageSize, this.isLetterboxed)
      .then((originalImage) => {
        workerConfigs.forEach((config) => {
          let image: Float32Array = originalImage.slice();
          image = config.imageProcessor.process(image);

          let worker = new Worker(
            new URL("../workers/traceEngine.worker.ts", import.meta.url),
            { type: "module" },
          );

          worker.postMessage({
            matrix: image,
            width: this.imageSize,
            pins: $state.snapshot(this.pinLayout!.pins),
            adjacencies: $state.snapshot(this.pinLayout!.adjacencies),
            config: $state.snapshot(this.config),
          });

          worker.onmessage = (e) => {
            const { type, progress, frame, result, executionTimeMs } = e.data;

            const existingIndex = this.liveFrames.findIndex(
              (f) => f.color === config.color,
            );
            if (existingIndex !== -1) {
              this.liveFrames[existingIndex].data = frame;
            } else {
              this.liveFrames.push({
                color: config.color,
                data: frame,
              });
            }
            config.frameProcessor.process(this.liveFrames);

            if (type === "progress") {
              workerStatuses[config.color].progress = progress;
              const statuses = Object.values(workerStatuses);
              const totalProgressSum = statuses.reduce(
                (sum, status) => sum + status.progress,
                0,
              );
              this.threadingProgress = totalProgressSum / statuses.length;
            } else if (type === "complete") {
              let threadResult = result as ThreadResult;
              threadResult.color = config.color;
              if (this.threadColorTheme !== "rgb" || config.color !== "white") {
                this.threadResults?.push(threadResult);
              }

              workerStatuses[config.color].running = false;
              workerStatuses[config.color].progress = 100;
              if (
                Object.values(workerStatuses).every((status) => !status.running)
              ) {
                this.isProcessingThreads = false;
                this.threadingProgress = 100;
                this.threadStats = new ThreadResultProcessor().getStats(
                  this.threadResults!,
                  this.pinLayout!,
                  executionTimeMs,
                );
              }
            }
          };
        });
      });
  }

  export(type: ExportType, options: ExportOptions) {
    switch (type) {
      case "csv":
        return new CsvExportProcessor(this.imageSize).export(
          this.threadResults!,
          this.pinLayout!,
        );
      case "console-command":
        return new ConsoleCommandExportProcessor(
          options.scale,
          this.imageSize,
          options.animationTime,
        ).export(this.threadResults!, this.pinLayout!);
      case "blueprint":
        return new BlueprintExportProcessor(
          options.scale,
          this.imageSize,
          options.name,
        ).export(this.threadResults!, this.pinLayout!);
      default:
        return;
    }
  }
}

export const pipeline = new UnifiedOrchestratorState();
