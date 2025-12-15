/**
 * Supported aspect ratios for image generation
 */
export type AspectRatio =
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9"
  | "21:9";

/**
 * Supported image sizes
 */
export type ImageSize = "1K" | "2K" | "4K";

/**
 * Supported models for image generation
 */
export type Model = "gemini-2.0-flash-exp" | "imagen-3.0-generate-002";

/**
 * Input image for image-to-image generation
 */
export interface InputImage {
  /** Base64 encoded image data */
  data: string;
  /** MIME type of the image */
  mimeType: string;
}

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
  /** The prompt describing the image to generate */
  prompt: string;
  /** API key for authentication */
  apiKey: string;
  /** Model to use for generation */
  model?: Model;
  /** Aspect ratio of the generated image */
  aspectRatio?: AspectRatio;
  /** Size of the generated image */
  imageSize?: ImageSize;
  /** Output file path */
  outputPath?: string;
  /** Number of images to generate (1-4) */
  numberOfImages?: number;
  /** Input image for image-to-image modification */
  inputImage?: InputImage;
}

/**
 * Image configuration for the API request
 */
export interface ImageConfig {
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
}

/**
 * Generation configuration for the API request
 */
export interface GenerationConfig {
  responseModalities: string[];
  imageConfig?: ImageConfig;
}

/**
 * Part of the content in API request/response
 */
export interface ContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Content structure for API request/response
 */
export interface Content {
  parts: ContentPart[];
  role?: string;
}

/**
 * API request body
 */
export interface GenerateContentRequest {
  contents: Content[];
  generationConfig: GenerationConfig;
}

/**
 * Candidate in API response
 */
export interface Candidate {
  content: Content;
  finishReason?: string;
  index?: number;
}

/**
 * API response structure
 */
export interface GenerateContentResponse {
  candidates?: Candidate[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  };
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Result of image generation
 */
export interface GenerationResult {
  success: boolean;
  images?: Array<{
    data: Buffer;
    mimeType: string;
  }>;
  text?: string;
  error?: string;
}

/**
 * CLI options parsed from command line arguments
 */
export interface CLIOptions {
  prompt?: string;
  key?: string;
  output?: string;
  model?: Model;
  aspectRatio?: AspectRatio;
  size?: ImageSize;
  count?: number;
  /** Path to input image for image-to-image modification */
  image?: string;
}
