#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install

echo "Building workspace packages and viewers..."
pnpm build:viewers

echo "Starting dev server..."
exec pnpm --filter @embedpdf/example-vue-tailwind dev --host
