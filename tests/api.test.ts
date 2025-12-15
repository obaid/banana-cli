import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateApiKey,
  getExtensionForMimeType,
  getMimeTypeFromExtension,
  generateImage,
  AVAILABLE_MODELS,
  AVAILABLE_ASPECT_RATIOS,
  AVAILABLE_IMAGE_SIZES,
} from "../src/api.js";

describe("validateApiKey", () => {
  it("should return error for undefined API key", () => {
    const result = validateApiKey(undefined);
    expect(result).toContain("API key is required");
  });

  it("should return error for empty string API key", () => {
    const result = validateApiKey("");
    expect(result).toContain("API key is required");
  });

  it("should return error for too short API key", () => {
    const result = validateApiKey("short");
    expect(result).toContain("too short");
  });

  it("should return null for valid API key", () => {
    const result = validateApiKey("AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    expect(result).toBeNull();
  });
});

describe("getExtensionForMimeType", () => {
  it("should return .png for image/png", () => {
    expect(getExtensionForMimeType("image/png")).toBe(".png");
  });

  it("should return .jpg for image/jpeg", () => {
    expect(getExtensionForMimeType("image/jpeg")).toBe(".jpg");
  });

  it("should return .webp for image/webp", () => {
    expect(getExtensionForMimeType("image/webp")).toBe(".webp");
  });

  it("should return .gif for image/gif", () => {
    expect(getExtensionForMimeType("image/gif")).toBe(".gif");
  });

  it("should return .png for unknown mime type", () => {
    expect(getExtensionForMimeType("unknown/type")).toBe(".png");
  });
});

describe("getMimeTypeFromExtension", () => {
  it("should return image/png for .png files", () => {
    expect(getMimeTypeFromExtension("image.png")).toBe("image/png");
    expect(getMimeTypeFromExtension("/path/to/image.PNG")).toBe("image/png");
  });

  it("should return image/jpeg for .jpg and .jpeg files", () => {
    expect(getMimeTypeFromExtension("photo.jpg")).toBe("image/jpeg");
    expect(getMimeTypeFromExtension("photo.jpeg")).toBe("image/jpeg");
  });

  it("should return image/webp for .webp files", () => {
    expect(getMimeTypeFromExtension("image.webp")).toBe("image/webp");
  });

  it("should return image/gif for .gif files", () => {
    expect(getMimeTypeFromExtension("animation.gif")).toBe("image/gif");
  });

  it("should return image/png for unknown extensions", () => {
    expect(getMimeTypeFromExtension("file.unknown")).toBe("image/png");
  });
});

describe("AVAILABLE_MODELS", () => {
  it("should contain gemini-2.0-flash-exp", () => {
    const modelValues = AVAILABLE_MODELS.map((m) => m.value);
    expect(modelValues).toContain("gemini-2.0-flash-exp");
  });

  it("should contain imagen-3.0-generate-002", () => {
    const modelValues = AVAILABLE_MODELS.map((m) => m.value);
    expect(modelValues).toContain("imagen-3.0-generate-002");
  });

  it("should have descriptions for all models", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(model.description).toBeTruthy();
      expect(model.description.length).toBeGreaterThan(0);
    }
  });
});

describe("AVAILABLE_ASPECT_RATIOS", () => {
  it("should contain common aspect ratios", () => {
    expect(AVAILABLE_ASPECT_RATIOS).toContain("1:1");
    expect(AVAILABLE_ASPECT_RATIOS).toContain("16:9");
    expect(AVAILABLE_ASPECT_RATIOS).toContain("9:16");
    expect(AVAILABLE_ASPECT_RATIOS).toContain("4:3");
  });

  it("should have correct number of aspect ratios", () => {
    expect(AVAILABLE_ASPECT_RATIOS.length).toBe(10);
  });
});

describe("AVAILABLE_IMAGE_SIZES", () => {
  it("should contain all supported sizes", () => {
    expect(AVAILABLE_IMAGE_SIZES).toContain("1K");
    expect(AVAILABLE_IMAGE_SIZES).toContain("2K");
    expect(AVAILABLE_IMAGE_SIZES).toContain("4K");
  });

  it("should have exactly 3 sizes", () => {
    expect(AVAILABLE_IMAGE_SIZES.length).toBe(3);
  });
});

describe("generateImage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should return error for failed request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () =>
        Promise.resolve({
          error: { message: "Invalid API key" },
        }),
    });

    const result = await generateImage({
      prompt: "test",
      apiKey: "invalid-key-12345",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid API key");
  });

  it("should return error for blocked content", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          promptFeedback: {
            blockReason: "SAFETY",
          },
        }),
    });

    const result = await generateImage({
      prompt: "blocked content",
      apiKey: "valid-api-key-12345",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Content blocked");
  });

  it("should return error for empty candidates", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [],
        }),
    });

    const result = await generateImage({
      prompt: "test",
      apiKey: "valid-api-key-12345",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No candidates");
  });

  it("should return success with image data", async () => {
    const mockBase64 = Buffer.from("test image data").toString("base64");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: mockBase64,
                    },
                  },
                ],
              },
            },
          ],
        }),
    });

    const result = await generateImage({
      prompt: "test",
      apiKey: "valid-api-key-12345",
    });

    expect(result.success).toBe(true);
    expect(result.images).toBeDefined();
    expect(result.images?.length).toBe(1);
    expect(result.images?.[0].mimeType).toBe("image/png");
  });

  it("should handle network errors", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await generateImage({
      prompt: "test",
      apiKey: "valid-api-key-12345",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
  });

  it("should include aspect ratio in request when provided", async () => {
    let capturedBody: any;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: Buffer.from("test").toString("base64"),
                      },
                    },
                  ],
                },
              },
            ],
          }),
      });
    });

    await generateImage({
      prompt: "test",
      apiKey: "valid-api-key-12345",
      aspectRatio: "16:9",
    });

    expect(capturedBody.generationConfig.imageConfig?.aspectRatio).toBe("16:9");
  });

  it("should include image size in request when provided", async () => {
    let capturedBody: any;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: Buffer.from("test").toString("base64"),
                      },
                    },
                  ],
                },
              },
            ],
          }),
      });
    });

    await generateImage({
      prompt: "test",
      apiKey: "valid-api-key-12345",
      imageSize: "2K",
    });

    expect(capturedBody.generationConfig.imageConfig?.imageSize).toBe("2K");
  });

  it("should include input image in request when provided", async () => {
    let capturedBody: any;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: Buffer.from("test").toString("base64"),
                      },
                    },
                  ],
                },
              },
            ],
          }),
      });
    });

    const inputImageData = Buffer.from("input image").toString("base64");

    await generateImage({
      prompt: "modify this image",
      apiKey: "valid-api-key-12345",
      inputImage: {
        data: inputImageData,
        mimeType: "image/png",
      },
    });

    // Should have text part and inline data part
    expect(capturedBody.contents[0].parts.length).toBe(2);
    expect(capturedBody.contents[0].parts[0].text).toBe("modify this image");
    expect(capturedBody.contents[0].parts[1].inlineData.mimeType).toBe("image/png");
    expect(capturedBody.contents[0].parts[1].inlineData.data).toBe(inputImageData);
  });
});
