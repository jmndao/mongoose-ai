#!/usr/bin/env node
/**
 * Build script for mongoose-ai
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Building mongoose-ai...");

// Clean dist folder
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log("🧹 Cleaned dist folder");
}

try {
  // Build with tsup - only include src files
  execSync("npx tsup src/index.ts --dts --format cjs,esm --clean --sourcemap", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("✅ Build completed successfully!");

  // Verify build outputs
  const outputs = ["dist/index.js", "dist/index.mjs", "dist/index.d.ts"];
  for (const output of outputs) {
    const outputPath = path.join(__dirname, "..", output);
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`📦 ${output} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.warn(`⚠️  Missing ${output}`);
    }
  }
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
