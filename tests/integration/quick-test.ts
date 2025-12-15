#!/usr/bin/env npx tsx

/**
 * Quick integration test for banana-cli
 *
 * Runs a small subset of tests for quick verification.
 *
 * Run with: npx tsx tests/integration/quick-test.ts
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = resolve(__dirname, "../output");
const FIXTURES_DIR = resolve(__dirname, "../fixtures");

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log("🍌 Banana-CLI Quick Test\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY environment variable is not set");
    process.exit(1);
  }

  const cliPath = resolve(__dirname, "../../dist/index.js");

  // Test 1: Basic text-to-image
  console.log("Test 1: Basic text-to-image generation...");
  try {
    execSync(
      `node ${cliPath} -i "A happy golden retriever puppy in a flower field" -o "${join(OUTPUT_DIR, "quick_puppy.png")}"`,
      { encoding: "utf-8", env: process.env, timeout: 120000 }
    );
    console.log("✅ Test 1 passed!\n");
  } catch (error) {
    console.log("❌ Test 1 failed!\n");
    process.exit(1);
  }

  // Test 2: Image-to-image (if fixture exists)
  const baseApple = join(FIXTURES_DIR, "base_apple.png");
  if (existsSync(baseApple)) {
    console.log("Test 2: Image-to-image modification...");
    try {
      execSync(
        `node ${cliPath} -i "Make this apple look like it's made of glass" --image "${baseApple}" -o "${join(OUTPUT_DIR, "quick_glass_apple.png")}"`,
        { encoding: "utf-8", env: process.env, timeout: 120000 }
      );
      console.log("✅ Test 2 passed!\n");
    } catch (error) {
      console.log("❌ Test 2 failed!\n");
      process.exit(1);
    }
  } else {
    console.log("⏭️  Test 2 skipped (no base fixture)\n");
  }

  console.log("🎉 Quick tests completed!");
  console.log(`Output saved to: ${OUTPUT_DIR}`);
}

main();
