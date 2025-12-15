import { Command } from "commander";
import { writeFile, readFile } from "fs/promises";
import { resolve, dirname, basename, extname } from "path";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import {
  generateImage,
  validateApiKey,
  getExtensionForMimeType,
  getMimeTypeFromExtension,
  AVAILABLE_MODELS,
  AVAILABLE_ASPECT_RATIOS,
  AVAILABLE_IMAGE_SIZES,
} from "./api.js";
import {
  CLIOptions,
  AspectRatio,
  ImageSize,
  Model,
  ImageGenerationOptions,
  InputImage,
} from "./types.js";

/**
 * Create and configure the CLI program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name("banana")
    .description(
      "Generate images using Google Gemini API (nano-banana)\n\n" +
        "Examples:\n" +
        '  $ banana -i "A cute monkey eating a banana"\n' +
        '  $ banana -i "A sunset over mountains" -o sunset.png\n' +
        '  $ banana -i "Abstract art" --aspect-ratio 16:9 --size 2K\n' +
        '  $ banana -k "YOUR_API_KEY" -i "A futuristic city"'
    )
    .version("1.0.0");

  program
    .requiredOption("-i, --input <prompt>", "Image generation prompt (required)")
    .option(
      "-k, --key <apiKey>",
      "Gemini API key (defaults to GEMINI_API_KEY env variable)"
    )
    .option(
      "-o, --output <path>",
      "Output file path (defaults to generated_<timestamp>.png)"
    )
    .option(
      "-m, --model <model>",
      `Model to use: ${AVAILABLE_MODELS.map((m) => m.value).join(", ")}`,
      "gemini-2.0-flash-exp"
    )
    .option(
      "-a, --aspect-ratio <ratio>",
      `Aspect ratio: ${AVAILABLE_ASPECT_RATIOS.join(", ")}`
    )
    .option(
      "-s, --size <size>",
      `Image size: ${AVAILABLE_IMAGE_SIZES.join(", ")}`
    )
    .option(
      "-n, --count <number>",
      "Number of images to generate (1-4)",
      "1"
    )
    .option(
      "--image <path>",
      "Input image path for image-to-image modification"
    );

  return program;
}

/**
 * Parse and validate CLI options
 */
export function parseOptions(program: Command): CLIOptions {
  const opts = program.opts();

  return {
    prompt: opts.input,
    key: opts.key,
    output: opts.output,
    model: opts.model as Model,
    aspectRatio: opts.aspectRatio as AspectRatio,
    size: opts.size as ImageSize,
    count: parseInt(opts.count, 10),
    image: opts.image,
  };
}

/**
 * Validate CLI options
 */
export function validateOptions(options: CLIOptions): string | null {
  // Validate prompt
  if (!options.prompt || options.prompt.trim() === "") {
    return "Prompt is required. Use -i or --input to specify a prompt.";
  }

  // Validate model
  const validModels = AVAILABLE_MODELS.map((m) => m.value);
  if (options.model && !validModels.includes(options.model)) {
    return `Invalid model. Available models: ${validModels.join(", ")}`;
  }

  // Validate aspect ratio
  if (
    options.aspectRatio &&
    !AVAILABLE_ASPECT_RATIOS.includes(options.aspectRatio as any)
  ) {
    return `Invalid aspect ratio. Available ratios: ${AVAILABLE_ASPECT_RATIOS.join(", ")}`;
  }

  // Validate size
  if (options.size && !AVAILABLE_IMAGE_SIZES.includes(options.size as any)) {
    return `Invalid size. Available sizes: ${AVAILABLE_IMAGE_SIZES.join(", ")}`;
  }

  // Validate count
  if (options.count !== undefined) {
    if (isNaN(options.count) || options.count < 1 || options.count > 4) {
      return "Count must be a number between 1 and 4.";
    }
  }

  return null;
}

/**
 * Generate output filename
 */
export function generateOutputFilename(
  outputPath: string | undefined,
  index: number,
  mimeType: string
): string {
  const extension = getExtensionForMimeType(mimeType);
  const timestamp = Date.now();

  if (outputPath) {
    const dir = dirname(outputPath);
    const base = basename(outputPath, extname(outputPath));
    const ext = extname(outputPath) || extension;

    if (index === 0) {
      return resolve(dir, `${base}${ext}`);
    }
    return resolve(dir, `${base}_${index + 1}${ext}`);
  }

  if (index === 0) {
    return resolve(process.cwd(), `generated_${timestamp}${extension}`);
  }
  return resolve(process.cwd(), `generated_${timestamp}_${index + 1}${extension}`);
}

/**
 * Save image to file
 */
export async function saveImage(
  data: Buffer,
  filePath: string
): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, data);
}

/**
 * Load an image from file and return as InputImage
 */
export async function loadInputImage(imagePath: string): Promise<InputImage> {
  const absolutePath = resolve(imagePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Input image not found: ${absolutePath}`);
  }

  const imageData = await readFile(absolutePath);
  const mimeType = getMimeTypeFromExtension(absolutePath);

  return {
    data: imageData.toString("base64"),
    mimeType,
  };
}

/**
 * Main CLI execution function
 */
export async function run(argv?: string[]): Promise<number> {
  const program = createProgram();

  try {
    program.parse(argv);
  } catch (error) {
    // Commander throws on missing required options
    console.error("Error:", error instanceof Error ? error.message : error);
    return 1;
  }

  const options = parseOptions(program);

  // Get API key from options or environment
  const apiKey = options.key || process.env.GEMINI_API_KEY;

  // Validate API key
  const apiKeyError = validateApiKey(apiKey);
  if (apiKeyError) {
    console.error("Error:", apiKeyError);
    return 1;
  }

  // Validate other options
  const optionsError = validateOptions(options);
  if (optionsError) {
    console.error("Error:", optionsError);
    return 1;
  }

  console.log(`Generating image with prompt: "${options.prompt}"`);
  console.log(`Model: ${options.model}`);
  if (options.aspectRatio) {
    console.log(`Aspect ratio: ${options.aspectRatio}`);
  }
  if (options.size) {
    console.log(`Size: ${options.size}`);
  }
  if (options.image) {
    console.log(`Input image: ${options.image}`);
  }

  // Load input image if provided
  let inputImage: InputImage | undefined;
  if (options.image) {
    try {
      inputImage = await loadInputImage(options.image);
      console.log(`Loaded input image (${inputImage.mimeType})`);
    } catch (error) {
      console.error(
        "Error loading input image:",
        error instanceof Error ? error.message : error
      );
      return 1;
    }
  }

  const generationOptions: ImageGenerationOptions = {
    prompt: options.prompt!,
    apiKey: apiKey!,
    model: options.model,
    aspectRatio: options.aspectRatio,
    imageSize: options.size,
    numberOfImages: options.count,
    inputImage,
  };

  const result = await generateImage(generationOptions);

  if (!result.success) {
    console.error("Error:", result.error);
    if (result.text) {
      console.log("API response text:", result.text);
    }
    return 1;
  }

  if (!result.images || result.images.length === 0) {
    console.error("Error: No images were generated");
    return 1;
  }

  // Save images
  const savedPaths: string[] = [];
  for (let i = 0; i < result.images.length; i++) {
    const image = result.images[i];
    const outputPath = generateOutputFilename(
      options.output,
      i,
      image.mimeType
    );

    try {
      await saveImage(image.data, outputPath);
      savedPaths.push(outputPath);
      console.log(`Image saved: ${outputPath}`);
    } catch (error) {
      console.error(
        `Error saving image ${i + 1}:`,
        error instanceof Error ? error.message : error
      );
      return 1;
    }
  }

  if (result.text) {
    console.log("\nAPI response:", result.text);
  }

  console.log(`\nSuccessfully generated ${savedPaths.length} image(s).`);
  return 0;
}
