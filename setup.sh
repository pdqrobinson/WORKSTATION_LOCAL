#!/usr/bin/env bash
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js first." >&2
  exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "cargo not found. Install Rust (rustup) first." >&2
  exit 1
fi

npm install

# Build frontend
npm run build

# Build Tauri app
npm run tauri build

echo "Build complete."
