#!/usr/bin/env node

/**
 * MCP Server for banana-cli
 *
 * Exposes image generation capabilities as MCP tools for use with
 * Claude Code, Gemini CLI, and other MCP-compatible AI assistants.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";

import {
  generateImage,
  getMimeTypeFromExtension,
  getExtensionForMimeType,
} from "./api.js";
import { AspectRatio, ImageSize, Model } from "./types.js";

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "generate_image",
    description:
      "Generate an image from a text description using Google Gemini's image generation API. " +
      "Returns the path to the generated image file.",
    inputSchema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description: "Text description of the image to generate",
        },
        output: {
          type: "string",
          description:
            "Output file path (e.g., 'image.png'). If not provided, generates a timestamped filename.",
        },
        model: {
          type: "string",
          enum: ["gemini-2.0-flash-exp", "imagen-3.0-generate-002"],
          description: "Model to use for generation. Default: gemini-2.0-flash-exp",
        },
        aspectRatio: {
          type: "string",
          enum: [
            "1:1",
            "2:3",
            "3:2",
            "3:4",
            "4:3",
            "4:5",
            "5:4",
            "9:16",
            "16:9",
            "21:9",
          ],
          description: "Aspect ratio of the output image",
        },
        size: {
          type: "string",
          enum: ["1K", "2K", "4K"],
          description: "Output image resolution",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "modify_image",
    description:
      "Modify an existing image based on a text description. " +
      "Takes an input image and transforms it according to the prompt. " +
      "Use for style transfer, adding elements, changing colors, etc.",
    inputSchema: {
      type: "object" as const,
      properties: {
        prompt: {
          type: "string",
          description:
            "Instructions for how to modify the image (e.g., 'Make it look like a watercolor painting')",
        },
        inputImage: {
          type: "string",
          description: "Path to the input image file to modify",
        },
        output: {
          type: "string",
          description:
            "Output file path for the modified image. If not provided, generates a timestamped filename.",
        },
        model: {
          type: "string",
          enum: ["gemini-2.0-flash-exp", "imagen-3.0-generate-002"],
          description: "Model to use for generation. Default: gemini-2.0-flash-exp",
        },
      },
      required: ["prompt", "inputImage"],
    },
  },
];

/**
 * Get API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is required. " +
        "Get your API key from https://aistudio.google.com/apikey"
    );
  }
  return apiKey;
}

/**
 * Generate output filename with timestamp
 */
function generateOutputPath(outputPath?: string, mimeType = "image/png"): string {
  if (outputPath) {
    return resolve(process.cwd(), outputPath);
  }
  const extension = getExtensionForMimeType(mimeType);
  const timestamp = Date.now();
  return resolve(process.cwd(), `generated_${timestamp}${extension}`);
}

/**
 * Save image buffer to file
 */
async function saveImage(data: Buffer, filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, data);
}

/**
 * Load image from file as base64
 */
async function loadImage(
  imagePath: string
): Promise<{ data: string; mimeType: string }> {
  const absolutePath = resolve(process.cwd(), imagePath);

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
 * Handle generate_image tool call
 */
async function handleGenerateImage(args: {
  prompt: string;
  output?: string;
  model?: Model;
  aspectRatio?: AspectRatio;
  size?: ImageSize;
}): Promise<string> {
  const apiKey = getApiKey();

  const result = await generateImage({
    prompt: args.prompt,
    apiKey,
    model: args.model,
    aspectRatio: args.aspectRatio,
    imageSize: args.size,
  });

  if (!result.success || !result.images || result.images.length === 0) {
    throw new Error(result.error || "Failed to generate image");
  }

  const image = result.images[0];
  const outputPath = generateOutputPath(args.output, image.mimeType);
  await saveImage(image.data, outputPath);

  return JSON.stringify({
    success: true,
    path: outputPath,
    message: `Image generated successfully: ${outputPath}`,
    description: result.text,
  });
}

/**
 * Handle modify_image tool call
 */
async function handleModifyImage(args: {
  prompt: string;
  inputImage: string;
  output?: string;
  model?: Model;
}): Promise<string> {
  const apiKey = getApiKey();

  // Load input image
  const inputImageData = await loadImage(args.inputImage);

  const result = await generateImage({
    prompt: args.prompt,
    apiKey,
    model: args.model,
    inputImage: inputImageData,
  });

  if (!result.success || !result.images || result.images.length === 0) {
    throw new Error(result.error || "Failed to modify image");
  }

  const image = result.images[0];
  const outputPath = generateOutputPath(args.output, image.mimeType);
  await saveImage(image.data, outputPath);

  return JSON.stringify({
    success: true,
    path: outputPath,
    message: `Image modified successfully: ${outputPath}`,
    inputImage: resolve(process.cwd(), args.inputImage),
    description: result.text,
  });
}

/**
 * Main MCP server setup
 */
async function main() {
  const server = new Server(
    {
      name: "banana-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case "generate_image":
          result = await handleGenerateImage(args as Parameters<typeof handleGenerateImage>[0]);
          break;

        case "modify_image":
          result = await handleModifyImage(args as Parameters<typeof handleModifyImage>[0]);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: result,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: errorMessage,
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (not stdout, which is used for MCP communication)
  console.error("Banana MCP server started");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
