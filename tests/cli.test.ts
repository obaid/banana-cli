import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createProgram,
  parseOptions,
  validateOptions,
  generateOutputFilename,
} from "../src/cli.js";

describe("createProgram", () => {
  it("should create a commander program", () => {
    const program = createProgram();
    expect(program.name()).toBe("banana");
  });

  it("should have correct version", () => {
    const program = createProgram();
    expect(program.version()).toBe("1.0.0");
  });

  it("should have required input option", () => {
    const program = createProgram();
    const inputOption = program.options.find(
      (opt) => opt.short === "-i" || opt.long === "--input"
    );
    expect(inputOption).toBeDefined();
    expect(inputOption?.required).toBe(true);
  });
});

describe("parseOptions", () => {
  it("should parse input option", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test prompt"]);
    const options = parseOptions(program);
    expect(options.prompt).toBe("test prompt");
  });

  it("should parse key option", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test", "-k", "my-api-key"]);
    const options = parseOptions(program);
    expect(options.key).toBe("my-api-key");
  });

  it("should parse output option", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test", "-o", "output.png"]);
    const options = parseOptions(program);
    expect(options.output).toBe("output.png");
  });

  it("should parse model option", () => {
    const program = createProgram();
    program.parse([
      "node",
      "banana",
      "-i",
      "test",
      "-m",
      "imagen-3.0-generate-002",
    ]);
    const options = parseOptions(program);
    expect(options.model).toBe("imagen-3.0-generate-002");
  });

  it("should parse aspect-ratio option", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test", "-a", "16:9"]);
    const options = parseOptions(program);
    expect(options.aspectRatio).toBe("16:9");
  });

  it("should parse size option", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test", "-s", "2K"]);
    const options = parseOptions(program);
    expect(options.size).toBe("2K");
  });

  it("should parse count option", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test", "-n", "3"]);
    const options = parseOptions(program);
    expect(options.count).toBe(3);
  });

  it("should use default values", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test"]);
    const options = parseOptions(program);
    expect(options.model).toBe("gemini-2.0-flash-exp");
    expect(options.aspectRatio).toBeUndefined();
    expect(options.size).toBeUndefined();
    expect(options.count).toBe(1);
    expect(options.image).toBeUndefined();
  });

  it("should parse image option", () => {
    const program = createProgram();
    program.parse(["node", "banana", "-i", "test", "--image", "input.png"]);
    const options = parseOptions(program);
    expect(options.image).toBe("input.png");
  });
});

describe("validateOptions", () => {
  it("should return error for empty prompt", () => {
    const error = validateOptions({ prompt: "" });
    expect(error).toContain("Prompt is required");
  });

  it("should return error for whitespace-only prompt", () => {
    const error = validateOptions({ prompt: "   " });
    expect(error).toContain("Prompt is required");
  });

  it("should return error for invalid model", () => {
    const error = validateOptions({
      prompt: "test",
      model: "invalid-model" as any,
    });
    expect(error).toContain("Invalid model");
  });

  it("should return error for invalid aspect ratio", () => {
    const error = validateOptions({
      prompt: "test",
      aspectRatio: "invalid" as any,
    });
    expect(error).toContain("Invalid aspect ratio");
  });

  it("should return error for invalid size", () => {
    const error = validateOptions({
      prompt: "test",
      size: "invalid" as any,
    });
    expect(error).toContain("Invalid size");
  });

  it("should return error for invalid count (too low)", () => {
    const error = validateOptions({
      prompt: "test",
      count: 0,
    });
    expect(error).toContain("Count must be");
  });

  it("should return error for invalid count (too high)", () => {
    const error = validateOptions({
      prompt: "test",
      count: 5,
    });
    expect(error).toContain("Count must be");
  });

  it("should return null for valid options", () => {
    const error = validateOptions({
      prompt: "test prompt",
      model: "gemini-2.0-flash-exp",
      aspectRatio: "16:9",
      size: "2K",
      count: 2,
    });
    expect(error).toBeNull();
  });
});

describe("generateOutputFilename", () => {
  it("should generate filename with timestamp when no output path", () => {
    const filename = generateOutputFilename(undefined, 0, "image/png");
    expect(filename).toMatch(/generated_\d+\.png$/);
  });

  it("should use provided output path", () => {
    const filename = generateOutputFilename("output.png", 0, "image/png");
    expect(filename).toContain("output.png");
  });

  it("should add index suffix for multiple images", () => {
    const filename = generateOutputFilename(undefined, 1, "image/png");
    expect(filename).toMatch(/generated_\d+_2\.png$/);
  });

  it("should add index suffix to custom output path", () => {
    const filename = generateOutputFilename("output.png", 1, "image/png");
    expect(filename).toContain("output_2.png");
  });

  it("should use correct extension for jpeg", () => {
    const filename = generateOutputFilename(undefined, 0, "image/jpeg");
    expect(filename).toMatch(/\.jpg$/);
  });

  it("should preserve custom extension", () => {
    const filename = generateOutputFilename("myimage.jpg", 0, "image/png");
    expect(filename).toContain("myimage.jpg");
  });
});
