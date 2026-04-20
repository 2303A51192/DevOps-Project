/**
 * LibraSearch — Frontend Build Script
 * Copies src/ → dist/ (production-ready static files)
 */

const fs   = require("fs");
const path = require("path");

const SRC  = path.join(__dirname, "src");
const DIST = path.join(__dirname, "dist");

// Clean dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// Copy all files
let count = 0;
fs.readdirSync(SRC).forEach(file => {
  fs.copyFileSync(path.join(SRC, file), path.join(DIST, file));
  console.log(`  ✅ Copied: ${file}`);
  count++;
});

// Verify index.html exists
const indexPath = path.join(DIST, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error("❌ Build failed: index.html not found in dist/");
  process.exit(1);
}

console.log(`\n🎉 Build complete! ${count} file(s) copied to dist/`);
