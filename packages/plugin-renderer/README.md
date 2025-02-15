# @embedpdf/plugin-renderer

Plugin for rendering PDF documents

## Installation

```bash
npm install @embedpdf/plugin-renderer
```

## Usage

```typescript
import { PDFCore } from '@embedpdf/core';
import { createPdfiumModule, PdfiumEngine } from '@embedpdf/engines';
import { RendererPlugin } from '@embedpdf/plugin-renderer';

const wasmBinary = await loadWasmBinary();
const wasmModule = await createPdfiumModule({ wasmBinary });
const engine = new PdfiumEngine(wasmModule, new ConsoleLogger());

const core = new PDFCore(engine);

// Initialize and register renderer plugin
const rendererPlugin = new RendererPlugin();
await core.registerPlugin(rendererPlugin);

const pdfDocument = await core.loadDocument({
  file: {
    id: '1',
    name: 'compressed.tracemonkey-pldi-09',
  },
  source: '/file/compressed.tracemonkey-pldi-09.pdf',
  password: ''
});

const canvas = document.getElementById('pageCanvas') as HTMLCanvasElement;
await rendererPlugin.renderPage(pdfDocument.pages[0], canvas);
```
