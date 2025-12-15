import {
  ImageGenerationOptions,
  GenerateContentRequest,
  GenerateContentResponse,
  GenerationResult,
  Model,
  ContentPart,
} from "./types.js";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Generate images using the Gemini API
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<GenerationResult> {
  const {
    prompt,
    apiKey,
    model = "gemini-2.0-flash-exp",
    aspectRatio,
    imageSize,
    numberOfImages = 1,
    inputImage,
  } = options;

  const url = `${API_BASE_URL}/${model}:generateContent`;

  // Build the parts array - text prompt first, then input image if provided
  const parts: ContentPart[] = [{ text: prompt }];

  if (inputImage) {
    parts.push({
      inlineData: {
        mimeType: inputImage.mimeType,
        data: inputImage.data,
      },
    });
  }

  const requestBody: GenerateContentRequest = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  // Add image configuration if specified
  if (aspectRatio || imageSize) {
    requestBody.generationConfig.imageConfig = {};
    if (aspectRatio) {
      requestBody.generationConfig.imageConfig.aspectRatio = aspectRatio;
    }
    if (imageSize) {
      requestBody.generationConfig.imageConfig.imageSize = imageSize;
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as GenerateContentResponse;

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    if (data.promptFeedback?.blockReason) {
      return {
        success: false,
        error: `Content blocked: ${data.promptFeedback.blockReason}`,
      };
    }

    if (!data.candidates || data.candidates.length === 0) {
      return {
        success: false,
        error: "No candidates returned from API",
      };
    }

    const images: Array<{ data: Buffer; mimeType: string }> = [];
    let text: string | undefined;

    for (const candidate of data.candidates) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          images.push({
            data: Buffer.from(part.inlineData.data, "base64"),
            mimeType: part.inlineData.mimeType,
          });
        }
        if (part.text) {
          text = part.text;
        }
      }
    }

    if (images.length === 0) {
      return {
        success: false,
        error: "No images generated. The API returned only text.",
        text,
      };
    }

    return {
      success: true,
      images,
      text,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Request failed: ${errorMessage}`,
    };
  }
}

/**
 * Validate the API key format
 */
export function validateApiKey(apiKey: string | undefined): string | null {
  if (!apiKey) {
    return "API key is required. Set GEMINI_API_KEY environment variable or use -k/--key option.";
  }
  if (apiKey.length < 10) {
    return "API key appears to be invalid (too short).";
  }
  return null;
}

/**
 * Get the file extension for a MIME type
 */
export function getExtensionForMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return extensions[mimeType] || ".png";
}

/**
 * Available models for display
 */
export const AVAILABLE_MODELS: { value: Model; description: string }[] = [
  {
    value: "gemini-2.0-flash-exp",
    description: "Gemini 2.0 Flash (experimental) - Fast, general-purpose",
  },
  {
    value: "imagen-3.0-generate-002",
    description: "Imagen 3 - High quality image generation",
  },
];

/**
 * Available aspect ratios for display
 */
export const AVAILABLE_ASPECT_RATIOS = [
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
] as const;

/**
 * Available image sizes for display
 */
export const AVAILABLE_IMAGE_SIZES = ["1K", "2K", "4K"] as const;

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(filePath: string): string {
  const ext = filePath.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return mimeTypes[ext || ""] || "image/png";
}
