#!/usr/bin/env node

import { run } from "./cli.js";

run(process.argv)
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
