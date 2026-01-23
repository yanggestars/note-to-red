#!/usr/bin/env bash
set -euo pipefail

# Run this script from the repo root (same dir as manifest.json / package.json)

TARGET_DIR="/Users/yuanbancang/Library/Mobile Documents/iCloud~md~obsidian/Documents/My-Obsidian/.obsidian/plugins/rednote-format"

echo "[1/5] Install deps (if needed)"
if [ ! -d "node_modules" ]; then
  npm install
fi

echo "[2/5] Build (npm run build, fallback to esbuild.config.mjs)"
if npm run build >/dev/null 2>&1; then
  : # ok
else
  node esbuild.config.mjs
fi

echo "[3/5] Locate build outputs"
MAIN_JS=""
for p in "./main.js" "./dist/main.js" "./build/main.js"; do
  if [ -f "$p" ]; then MAIN_JS="$p"; break; fi
done

if [ -z "$MAIN_JS" ]; then
  echo "ERROR: main.js not found. Searched: ./main.js ./dist/main.js ./build/main.js"
  exit 1
fi

STYLES_CSS=""
for p in "./styles.css" "./dist/styles.css" "./build/styles.css"; do
  if [ -f "$p" ]; then STYLES_CSS="$p"; break; fi
done

ASSETS_DIR=""
for p in "./assets" "./dist/assets" "./build/assets"; do
  if [ -d "$p" ]; then ASSETS_DIR="$p"; break; fi
done

echo "[4/5] Copy plugin files to Obsidian plugin folder"
mkdir -p "$TARGET_DIR"

# Required files
cp -f "manifest.json" "$TARGET_DIR/manifest.json"
cp -f "$MAIN_JS" "$TARGET_DIR/main.js"

# Optional files
if [ -n "$STYLES_CSS" ]; then
  cp -f "$STYLES_CSS" "$TARGET_DIR/styles.css"
else
  # If your plugin doesn't use styles.css, it's fine; remove old one if exists
  rm -f "$TARGET_DIR/styles.css" 2>/dev/null || true
fi

if [ -n "$ASSETS_DIR" ]; then
  rm -rf "$TARGET_DIR/assets" 2>/dev/null || true
  cp -R "$ASSETS_DIR" "$TARGET_DIR/assets"
fi

echo "[5/5] Done"
echo "Installed to: $TARGET_DIR"
ls -la "$TARGET_DIR"