# banana-cli

A powerful CLI tool for generating and modifying images using Google Gemini's image generation API (nano-banana).

[![npm version](https://img.shields.io/npm/v/banana-cli.svg)](https://www.npmjs.com/package/banana-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/banana-cli.svg)](https://nodejs.org)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Text-to-Image Generation](#text-to-image-generation)
  - [Image-to-Image Modification](#image-to-image-modification)
- [CLI Options](#cli-options)
- [Configuration](#configuration)
  - [API Key Setup](#api-key-setup)
  - [Available Models](#available-models)
  - [Aspect Ratios](#aspect-ratios)
  - [Image Sizes](#image-sizes)
- [Examples](#examples)
  - [Basic Examples](#basic-examples)
  - [Advanced Examples](#advanced-examples)
  - [Image Modification Examples](#image-modification-examples)
- [MCP Server](#mcp-server-model-context-protocol)
  - [Setup for Claude Code](#setup-for-claude-code)
  - [Setup for Gemini CLI](#setup-for-gemini-cli)
  - [Setup for Codex / Other Tools](#setup-for-openai-codex--other-tools)
  - [MCP Tool Schemas](#mcp-tool-schemas)
- [Direct CLI Usage with AI Tools](#direct-cli-usage-with-ai-tools)
- [Programmatic Usage](#programmatic-usage)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Text-to-Image Generation** - Generate images from text descriptions
- **Image-to-Image Modification** - Transform existing images with text prompts
- **Multiple Models** - Support for Gemini 2.0 Flash and Imagen 3
- **Flexible Output** - Custom filenames, automatic timestamps, multiple formats
- **Aspect Ratio Control** - 10 different aspect ratios (1:1, 16:9, 9:16, etc.)
- **Resolution Options** - Generate images in 1K, 2K, or 4K resolution
- **AI Tool Integration** - Designed to work with Claude Code, Gemini CLI, and other AI assistants
- **Cross-Platform** - Works on macOS, Linux, and Windows
- **Zero Configuration** - Works out of the box with just an API key

---

## Installation

### Global Installation (Recommended)

Install globally to use the `banana` command anywhere:

```bash
npm install -g banana-cli
```

### Local Installation

Install as a project dependency:

```bash
npm install banana-cli
```

Then run via npx:

```bash
npx banana -i "your prompt here"
```

### Verify Installation

```bash
banana --version
# Output: 1.0.0

banana --help
# Shows all available options
```

---

## Quick Start

### 1. Get your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your new API key

### 2. Set up your API Key

**Option A: Environment Variable (Recommended)**

```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export GEMINI_API_KEY="your-api-key-here"
```

**Option B: Pass as Argument**

```bash
banana -k "your-api-key" -i "your prompt"
```

### 3. Generate your first image

```bash
banana -i "A cute cartoon monkey eating a banana"
```

This will create a file like `generated_1234567890.png` in your current directory.

---

## Usage

### Text-to-Image Generation

Generate images from text descriptions:

```bash
# Basic generation (output: generated_<timestamp>.png)
banana -i "A sunset over the ocean"

# With custom output filename
banana -i "A mountain landscape" -o landscape.png

# With specific model
banana -i "Abstract art" -m gemini-2.0-flash-exp
```

### Image-to-Image Modification

Transform existing images using text prompts:

```bash
# Basic modification
banana -i "Make this image look like a watercolor painting" --image input.png

# With custom output
banana -i "Add snow to this scene" --image summer.png -o winter.png

# Style transfer
banana -i "Convert to anime style" --image photo.jpg -o anime.png
```

---

## CLI Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--input <prompt>` | `-i` | string | *required* | The text prompt describing the image to generate |
| `--key <apiKey>` | `-k` | string | `$GEMINI_API_KEY` | Google Gemini API key |
| `--output <path>` | `-o` | string | `generated_<timestamp>.png` | Output file path |
| `--image <path>` | | string | | Input image for image-to-image modification |
| `--model <model>` | `-m` | string | `gemini-2.0-flash-exp` | Model to use for generation |
| `--aspect-ratio <ratio>` | `-a` | string | | Aspect ratio of output image |
| `--size <size>` | `-s` | string | | Output image resolution |
| `--count <number>` | `-n` | number | `1` | Number of images to generate (1-4) |
| `--version` | `-V` | | | Display version number |
| `--help` | `-h` | | | Display help information |

---

## Configuration

### API Key Setup

The API key can be provided in two ways:

#### Environment Variable (Recommended)

Set the `GEMINI_API_KEY` environment variable:

```bash
# Linux/macOS - Add to ~/.bashrc or ~/.zshrc
export GEMINI_API_KEY="AIza..."

# Windows Command Prompt
set GEMINI_API_KEY=AIza...

# Windows PowerShell
$env:GEMINI_API_KEY="AIza..."
```

#### Command Line Argument

Pass the key directly:

```bash
banana -k "AIza..." -i "your prompt"
```

### Available Models

| Model ID | Description | Best For |
|----------|-------------|----------|
| `gemini-2.0-flash-exp` | Gemini 2.0 Flash (Experimental) | Fast, general-purpose image generation |
| `imagen-3.0-generate-002` | Imagen 3 | High-quality, detailed images |

**Usage:**

```bash
# Use default model (gemini-2.0-flash-exp)
banana -i "A forest path"

# Use Imagen 3
banana -i "A forest path" -m imagen-3.0-generate-002
```

### Aspect Ratios

Supported aspect ratios for image generation:

| Ratio | Use Case |
|-------|----------|
| `1:1` | Square images, social media posts, profile pictures |
| `2:3` | Portrait photos, book covers |
| `3:2` | Landscape photos, prints |
| `3:4` | Portrait mode, tablets |
| `4:3` | Standard displays, presentations |
| `4:5` | Instagram portrait |
| `5:4` | Large format prints |
| `9:16` | Mobile screens, stories, reels |
| `16:9` | Widescreen, desktop wallpapers, YouTube thumbnails |
| `21:9` | Ultra-wide displays, cinematic |

**Note:** Aspect ratio support varies by model. If not supported, the option will be ignored.

```bash
# Square image
banana -i "A logo design" -a 1:1

# Widescreen wallpaper
banana -i "Mountain panorama" -a 16:9

# Mobile wallpaper
banana -i "Abstract patterns" -a 9:16
```

### Image Sizes

| Size | Resolution | Use Case |
|------|------------|----------|
| `1K` | ~1024 pixels | Web, social media, quick previews |
| `2K` | ~2048 pixels | High-quality prints, detailed work |
| `4K` | ~4096 pixels | Large prints, professional use |

**Note:** Image size support varies by model. Higher resolutions may take longer to generate.

```bash
# Standard resolution
banana -i "A portrait" -s 1K

# High resolution
banana -i "Detailed illustration" -s 4K
```

---

## Examples

### Basic Examples

```bash
# Simple image generation
banana -i "A golden retriever puppy playing in autumn leaves"

# Save to specific location
banana -i "Neon cityscape at night" -o ./images/city.png

# Use Imagen 3 for higher quality
banana -i "Photorealistic portrait of an astronaut" -m imagen-3.0-generate-002
```

### Advanced Examples

```bash
# Widescreen wallpaper in high resolution
banana -i "Epic fantasy landscape with floating islands and waterfalls" \
  -a 16:9 \
  -s 2K \
  -o wallpaper.png

# Mobile wallpaper
banana -i "Minimalist geometric patterns in pastel colors" \
  -a 9:16 \
  -o mobile-wallpaper.png

# Generate multiple variations
banana -i "Logo design for a coffee shop called 'Morning Brew'" \
  -n 4 \
  -o logo.png
# Creates: logo.png, logo_2.png, logo_3.png, logo_4.png
```

### Image Modification Examples

```bash
# Style Transfer
banana -i "Transform into Van Gogh's Starry Night style" \
  --image photo.jpg \
  -o starry-photo.png

# Add Elements
banana -i "Add a rainbow in the background" \
  --image landscape.jpg \
  -o landscape-rainbow.png

# Color Changes
banana -i "Change the car color from blue to red" \
  --image blue-car.jpg \
  -o red-car.png

# Season Change
banana -i "Convert this summer scene to winter with snow" \
  --image summer-park.jpg \
  -o winter-park.png

# Artistic Remix
banana -i "Reimagine as a cyberpunk scene" \
  --image city-street.jpg \
  -o cyberpunk-street.png

# Background Change
banana -i "Place this product on a marble countertop" \
  --image product.png \
  -o product-styled.png
```

---

## MCP Server (Model Context Protocol)

`banana-cli` includes a built-in MCP server that exposes image generation as tools for AI assistants. This allows Claude Code, Gemini CLI, and other MCP-compatible tools to generate and modify images.

### MCP Tools Available

| Tool | Description |
|------|-------------|
| `generate_image` | Generate an image from a text description |
| `modify_image` | Modify an existing image based on instructions |

### Setup for Claude Code

1. **Install banana-cli globally:**
   ```bash
   npm install -g banana-cli
   ```

2. **Set your API key:**
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

3. **Add to Claude Code settings:**

   Open your Claude Code settings file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

   Add the banana MCP server:

   ```json
   {
     "mcpServers": {
       "banana": {
         "command": "banana-mcp",
         "env": {
           "GEMINI_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

   Or if using npx:

   ```json
   {
     "mcpServers": {
       "banana": {
         "command": "npx",
         "args": ["-y", "banana-cli", "banana-mcp"],
         "env": {
           "GEMINI_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

4. **Restart Claude Code** to load the new MCP server.

5. **Use in conversations:**
   ```
   You: Generate an image of a cute robot cooking pasta

   Claude: I'll generate that image for you using the banana tool.
   [Uses generate_image tool]

   Image generated successfully: /path/to/generated_1234567890.png
   ```

### Setup for Gemini CLI

1. **Install banana-cli:**
   ```bash
   npm install -g banana-cli
   ```

2. **Add to Gemini CLI settings** (`~/.gemini/settings.json`):

   ```json
   {
     "mcpServers": {
       "banana": {
         "command": "banana-mcp",
         "env": {
           "GEMINI_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

### Setup for OpenAI Codex / Other Tools

For tools that support MCP servers, use similar configuration:

```json
{
  "mcpServers": {
    "banana": {
      "command": "banana-mcp",
      "env": {
        "GEMINI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### MCP Tool Schemas

#### generate_image

```json
{
  "name": "generate_image",
  "description": "Generate an image from a text description",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "Text description of the image to generate"
      },
      "output": {
        "type": "string",
        "description": "Output file path (optional)"
      },
      "model": {
        "type": "string",
        "enum": ["gemini-2.0-flash-exp", "imagen-3.0-generate-002"]
      },
      "aspectRatio": {
        "type": "string",
        "enum": ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]
      },
      "size": {
        "type": "string",
        "enum": ["1K", "2K", "4K"]
      }
    },
    "required": ["prompt"]
  }
}
```

#### modify_image

```json
{
  "name": "modify_image",
  "description": "Modify an existing image based on instructions",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "description": "Instructions for modifying the image"
      },
      "inputImage": {
        "type": "string",
        "description": "Path to the input image file"
      },
      "output": {
        "type": "string",
        "description": "Output file path (optional)"
      },
      "model": {
        "type": "string",
        "enum": ["gemini-2.0-flash-exp", "imagen-3.0-generate-002"]
      }
    },
    "required": ["prompt", "inputImage"]
  }
}
```

### Testing the MCP Server

You can test the MCP server manually:

```bash
# Start the server (it communicates via stdin/stdout)
GEMINI_API_KEY="your-key" banana-mcp

# The server will wait for JSON-RPC messages on stdin
```

---

## Direct CLI Usage with AI Tools

You can also use the CLI directly without MCP:

### Claude Code (Direct)

```
You: Generate an image of a robot chef and save it as robot-chef.png

Claude: I'll generate that image for you.
> banana -i "A friendly robot chef wearing an apron, cooking in a modern kitchen" -o robot-chef.png
```

### Shell Scripts & Automation

```bash
#!/bin/bash
# generate-thumbnails.sh - Generate thumbnails for blog posts

POSTS_DIR="./posts"
IMAGES_DIR="./images"

for post in "$POSTS_DIR"/*.md; do
  title=$(head -1 "$post" | sed 's/# //')
  filename=$(basename "$post" .md)

  banana -i "Blog thumbnail for article titled: $title" \
    -a 16:9 \
    -o "$IMAGES_DIR/$filename-thumb.png"
done
```

---

## Programmatic Usage

While `banana-cli` is primarily a CLI tool, you can use it programmatically:

```typescript
import { execSync } from 'child_process';

function generateImage(prompt: string, output?: string): string {
  const args = [`-i`, `"${prompt}"`];
  if (output) args.push(`-o`, output);

  const result = execSync(`banana ${args.join(' ')}`, {
    encoding: 'utf-8',
    env: { ...process.env, GEMINI_API_KEY: 'your-key' }
  });

  return result;
}

// Usage
generateImage('A cute cat', 'cat.png');
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `API key is required` | No API key provided | Set `GEMINI_API_KEY` env var or use `-k` flag |
| `Invalid API key` | Incorrect or expired key | Verify your key at [AI Studio](https://aistudio.google.com/apikey) |
| `Content blocked` | Prompt violated safety filters | Modify your prompt to comply with content policies |
| `No images generated` | API returned text only | Try rephrasing your prompt |
| `Input image not found` | Invalid `--image` path | Check the file path exists |
| `Rate limit exceeded` | Too many requests | Wait a moment and try again |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (see error message for details) |

---

## Troubleshooting

### Image not generating

1. **Check your API key:**
   ```bash
   echo $GEMINI_API_KEY
   # Should output your API key
   ```

2. **Test with a simple prompt:**
   ```bash
   banana -i "A red circle on white background" -o test.png
   ```

3. **Check for error messages** in the output

### Wrong aspect ratio / size

- Not all models support all aspect ratios and sizes
- Try without `-a` or `-s` flags first
- Check model documentation for supported options

### Slow generation

- 4K images take longer than 1K
- Complex prompts may take longer
- Consider using `gemini-2.0-flash-exp` for faster results

### Image looks wrong

- Be more specific in your prompt
- Add style descriptors: "digital art", "photorealistic", "cartoon style"
- For image-to-image, be clear about what to change vs. keep

---

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/obaid/banana-cli.git
cd banana-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev -- -i "prompt"` | Run in development mode |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:integration:quick` | Run quick integration test |
| `npm run test:integration` | Run full integration test suite |

### Project Structure

```
banana-cli/
├── src/
│   ├── index.ts        # CLI entry point
│   ├── cli.ts          # Argument parsing & execution logic
│   ├── api.ts          # Gemini API client
│   └── types.ts        # TypeScript type definitions
├── tests/
│   ├── api.test.ts     # API unit tests
│   ├── cli.test.ts     # CLI unit tests
│   ├── fixtures/       # Test fixtures (images)
│   └── integration/    # Integration tests
├── dist/               # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Running Tests

```bash
# Unit tests (fast, no API calls)
npm test

# Integration tests (requires GEMINI_API_KEY)
export GEMINI_API_KEY="your-key"
npm run test:integration:quick  # Quick smoke test
npm run test:integration        # Full test suite
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes** and add tests

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Commit your changes:**
   ```bash
   git commit -m "Add amazing feature"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**

### Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits focused and atomic

---

## Changelog

### v1.0.0

- Initial release
- Text-to-image generation
- Image-to-image modification
- Support for Gemini 2.0 Flash and Imagen 3
- Aspect ratio and size options
- Multiple output formats

---

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/obaid/banana-cli/issues)
- **Discussions:** [GitHub Discussions](https://github.com/obaid/banana-cli/discussions)

---

Made with AI by the community
