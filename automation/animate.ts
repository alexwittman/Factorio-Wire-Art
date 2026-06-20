import { chromium, type Page } from "playwright";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import os from "os";

interface PinConfig {
  type: "circle" | "square" | "voronoi";
  count: number;
  iterations: number;
}

interface OptimizeConfig {
  theme: "w" | "rgb";
  wire_count: number;
}

interface ExportConfig {
  scale: number;
}

interface FrameConfig {
  fps: number;
  frame_skip: number;
  frame_count: number;
  letterboxed: boolean;
}

interface WiringConfig {
  headless: boolean;
  threads: number;
  frames: FrameConfig;
  pins: PinConfig;
  optimize: OptimizeConfig;
  export: ExportConfig;
}

async function processImage(
  imagePath: string,
  config: WiringConfig,
): Promise<string> {
  const browser = await chromium.launch({ headless: config.headless });
  const page = await browser.newPage();
  page.setDefaultTimeout(0);

  await page.goto("http://localhost:5173");

  await uploadImage(page, imagePath, config.frames);
  await generatePins(page, config.pins);
  await generateWires(page, config.optimize);
  const data = await exportData(page, config.export);

  await browser.close();

  return data!;
}

async function uploadImage(page: Page, imagePath: string, config: FrameConfig) {
  console.log("Upload Image: Start");
  const absolutePath = path.resolve(imagePath);
  await page.setInputFiles('input[type="file"]', absolutePath);

  const cropButton = page.getByTestId(`crop-style-${config.letterboxed}`);
  await cropButton.click();

  await page.waitForTimeout(1000);
  console.log("Upload Image: Complete");
}

async function generatePins(page: Page, config: PinConfig) {
  console.log("Generate Pins: Start");
  await setSliderValue(page, "pin-count-slider", config.count, 40, 1000);
  await page.waitForTimeout(1000);

  const layoutButton = page.getByTestId(`pin-layout-${config.type}`);
  await layoutButton.click();

  await page.getByTestId("pin-generating-spinner").waitFor({ state: "hidden" });
  console.log("Generate Pins: Complete");
}

async function generateWires(page: Page, config: OptimizeConfig) {
  console.log("Generate Wires: Start");
  const colorButton = page.getByTestId(`wire-theme-${config.theme}`);
  await colorButton.click();

  await setSliderValue(
    page,
    "wire-count-slider",
    config.wire_count,
    1000,
    25000,
  );

  await page.getByTestId("generate-wires").click();

  await page
    .getByTestId("wire-generating-spinner")
    .waitFor({ state: "hidden" });
  await page.waitForTimeout(1000);
  console.log("Generate Wires: Complete");
}

async function exportData(
  page: Page,
  config: ExportConfig,
): Promise<string | null> {
  console.log("Export Data: Start");
  await page.getByTestId("mod-acknowledgement").click();

  await setSliderValue(page, "export-scale-slider", config.scale, 8, 64);

  await page.getByTestId("export-console").click();

  // await page.locator(".export-toast").waitFor({ state: "visible" });

  const command = await page.getByTestId("export-data").textContent();

  console.log("Export Data: Complete");
  return command;
}

async function setSliderValue(
  page: Page,
  testId: string,
  value: number,
  min: number,
  max: number,
) {
  const slider = page.getByTestId(testId);

  const box = await slider.boundingBox();
  if (!box) throw new Error("Slider not found");

  const percentage = (value - min) / (max - min);
  const targetX = box.x + box.width * percentage;
  const targetY = box.y + box.height / 2;

  await page.mouse.click(targetX, targetY);

  await page.waitForTimeout(100);
}

async function processFile(
  filePath: string,
  config: WiringConfig,
): Promise<string[]> {
  const ext = path.extname(filePath).toLowerCase();

  if ([".gif", ".mp4", ".mov", ".avi"].includes(ext)) {
    const fps = config.frames.fps === -1 ? undefined : config.frames.fps;
    const frames = await extractFrames(
      filePath,
      fps,
      config.frames.frame_count === -1 ? undefined : config.frames.frame_count,
      config.frames.frame_skip === -1 ? undefined : config.frames.frame_skip,
    );

    const results: string[] = new Array(frames.length);

    for (let i = 0; i < frames.length; i += config.threads) {
      const batch = frames.slice(i, i + config.threads);

      const batchPromises = batch.map((framePath, index) =>
        processImage(framePath, config).then((result) => {
          const globalIndex = i + index;
          results[globalIndex] = result;
          console.log(
            `Progress: [${globalIndex + 1}/${frames.length}] frames processed.`,
          );
          return result;
        }),
      );

      await Promise.all(batchPromises);
    }
    return results;
  } else {
    return [await processImage(filePath, config)];
  }
}

async function extractFrames(
  videoPath: string,
  fps?: number,
  count?: number,
  skip?: number,
): Promise<string[]> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "frames-"));
  const framePaths: string[] = [];

  return new Promise((resolve, reject) => {
    const command = ffmpeg(videoPath);
    const filterParts: string[] = [];

    if (skip && skip > 0) {
      filterParts.push(`select=gte(n\\,${skip})`);
    }

    if (fps) {
      filterParts.push(`fps=${fps}`);
    }

    if (filterParts.length > 0) {
      command.outputOptions("-vf", filterParts.join(","));
    }

    if (count && count > 0) {
      command.outputOptions("-vframes", count.toString());
    }

    command
      .output(path.join(tempDir, "frame-%04d.png"))
      .on("start", (cmd) => console.log(`FFmpeg started: ${cmd}`))
      .on("error", (err) => reject(err))
      .on("end", () => {
        const files = fs.readdirSync(tempDir);
        files.sort().forEach((file) => {
          framePaths.push(path.join(tempDir, file));
        });
        console.log(`Extracted ${framePaths.length} frames to ${tempDir}`);
        resolve(framePaths);
      })
      .run();
  });
}

const sourcePath = process.argv[2];
const configPath = process.argv[3];
const outputPath = process.argv[4];
const rawConfig = fs.readFileSync(configPath, "utf-8");
const config: WiringConfig = JSON.parse(rawConfig);

processFile(sourcePath, config)
  .then((rawCommands) => {
    const frames = rawCommands.map((command) => {
      const prefix = "/build-wire-art";
      return command.replace(prefix, "").trim();
    });

    const animationCommand = `
      /register-wire-art-animation
      {
        frames = {${frames.join(",")}},
      }
    `;

    fs.writeFileSync(outputPath, animationCommand, "utf-8");
  })
  .catch((err) => {
    console.error("Processing failed:", err);
    process.exit(1);
  });
