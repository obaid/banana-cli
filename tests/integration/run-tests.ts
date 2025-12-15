#!/usr/bin/env npx tsx

/**
 * Integration tests for banana-cli
 *
 * These tests make real API calls to test various capabilities:
 * 1. Text-to-image generation
 * 2. Image-to-image modification
 * 3. Different styles and prompts
 *
 * Run with: npx tsx tests/integration/run-tests.ts
 *
 * Note: Requires GEMINI_API_KEY environment variable
 */

import { execSync } from "child_process";
import { existsSync, unlinkSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = resolve(__dirname, "../output");
const FIXTURES_DIR = resolve(__dirname, "../fixtures");

interface TestCase {
  name: string;
  description: string;
  args: string[];
  expectedOutput?: string;
  cleanup?: boolean;
}

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const testCases: TestCase[] = [
  // Text-to-image tests
  {
    name: "basic-generation",
    description: "Basic text-to-image generation",
    args: ["-i", "A cute cartoon cat playing with yarn", "-o", join(OUTPUT_DIR, "test_cat.png")],
  },
  {
    name: "artistic-style",
    description: "Generate image with artistic style prompt",
    args: [
      "-i",
      "A cyberpunk cityscape at night with neon lights, digital art style",
      "-o",
      join(OUTPUT_DIR, "test_cyberpunk.png"),
    ],
  },
  {
    name: "nature-scene",
    description: "Generate nature scene",
    args: [
      "-i",
      "A serene mountain lake at sunrise with mist rising from the water",
      "-o",
      join(OUTPUT_DIR, "test_lake.png"),
    ],
  },
  {
    name: "abstract-art",
    description: "Generate abstract artwork",
    args: [
      "-i",
      "Abstract geometric patterns in vibrant colors, modern art style",
      "-o",
      join(OUTPUT_DIR, "test_abstract.png"),
    ],
  },
  {
    name: "character-design",
    description: "Generate character design",
    args: [
      "-i",
      "A friendly robot chef wearing an apron and holding a whisk, cartoon style",
      "-o",
      join(OUTPUT_DIR, "test_robot_chef.png"),
    ],
  },

  // Image-to-image tests (using base_apple.png as source)
  {
    name: "img2img-style-transfer",
    description: "Transform apple to watercolor style",
    args: [
      "-i",
      "Transform this apple into a beautiful watercolor painting style",
      "--image",
      join(FIXTURES_DIR, "base_apple.png"),
      "-o",
      join(OUTPUT_DIR, "test_apple_watercolor.png"),
    ],
  },
  {
    name: "img2img-add-elements",
    description: "Add elements to existing image",
    args: [
      "-i",
      "Add a small friendly worm peeking out of the apple with a smile",
      "--image",
      join(FIXTURES_DIR, "base_apple.png"),
      "-o",
      join(OUTPUT_DIR, "test_apple_with_worm.png"),
    ],
  },
  {
    name: "img2img-change-color",
    description: "Change the color of the apple",
    args: [
      "-i",
      "Change this apple to a golden yellow color, keeping everything else the same",
      "--image",
      join(FIXTURES_DIR, "base_apple.png"),
      "-o",
      join(OUTPUT_DIR, "test_apple_golden.png"),
    ],
  },
  {
    name: "img2img-scene-change",
    description: "Change the scene/background",
    args: [
      "-i",
      "Place this apple in a cozy kitchen scene with warm lighting",
      "--image",
      join(FIXTURES_DIR, "base_apple.png"),
      "-o",
      join(OUTPUT_DIR, "test_apple_kitchen.png"),
    ],
  },
  {
    name: "img2img-artistic-remix",
    description: "Artistic remix of the apple",
    args: [
      "-i",
      "Reimagine this apple as a surrealist artwork in the style of Salvador Dali",
      "--image",
      join(FIXTURES_DIR, "base_apple.png"),
      "-o",
      join(OUTPUT_DIR, "test_apple_surreal.png"),
    ],
  },
];

function runTest(test: TestCase): boolean {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: ${test.name}`);
  console.log(`Description: ${test.description}`);
  console.log(`${"=".repeat(60)}`);

  const cliPath = resolve(__dirname, "../../dist/index.js");
  const command = `node ${cliPath} ${test.args.map((a) => `"${a}"`).join(" ")}`;

  console.log(`Command: banana ${test.args.join(" ")}\n`);

  try {
    const output = execSync(command, {
      encoding: "utf-8",
      env: process.env,
      timeout: 120000, // 2 minute timeout
    });

    console.log(output);

    // Check if output file was created
    const outputFile = test.args[test.args.indexOf("-o") + 1];
    if (outputFile && existsSync(outputFile)) {
      console.log(`✅ PASSED: Output file created at ${outputFile}`);
      return true;
    } else if (!outputFile) {
      console.log(`✅ PASSED: Command executed successfully`);
      return true;
    } else {
      console.log(`❌ FAILED: Output file not found`);
      return false;
    }
  } catch (error) {
    console.error(`❌ FAILED: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           BANANA-CLI INTEGRATION TESTS                       ║
║           Testing Google Gemini Image Generation             ║
╚══════════════════════════════════════════════════════════════╝
`);

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY environment variable is not set");
    process.exit(1);
  }

  // Check if base fixture exists
  const baseApple = join(FIXTURES_DIR, "base_apple.png");
  if (!existsSync(baseApple)) {
    console.log("Base fixture not found. Generating...");
    const cliPath = resolve(__dirname, "../../dist/index.js");
    execSync(
      `node ${cliPath} -i "A simple red apple on a white background, minimalist style" -o "${baseApple}"`,
      { encoding: "utf-8", env: process.env }
    );
    console.log("Base fixture created.\n");
  }

  const results: { name: string; passed: boolean }[] = [];

  for (const test of testCases) {
    const passed = runTest(test);
    results.push({ name: test.name, passed });

    // Add a small delay between tests to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Print summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUMMARY");
  console.log(`${"=".repeat(60)}`);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const result of results) {
    console.log(`${result.passed ? "✅" : "❌"} ${result.name}`);
  }

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`\nOutput images saved to: ${OUTPUT_DIR}`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
