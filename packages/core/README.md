# @cloudpdf/core

Core package for CloudPDF.

## Installation

```bash
npm install @cloudpdf/core
```

## Usage

```typescript
import { PDFCore } from '@cloudpdf/core';
import { createPdfiumModule, PdfiumEngine } from '@cloudpdf/engines';
import { NavigationPlugin } from '@cloudpdf/plugin-navigation';

const wasmBinary = await loadWasmBinary();
const wasmModule = await createPdfiumModule({ wasmBinary });
const engine = new PdfiumEngine(wasmModule, new ConsoleLogger());

const core = new PDFCore(engine);

const navigationPlugin = new NavigationPlugin({
  initialPage: 1,
  defaultScrollMode: 'continuous'
});

core.registerPlugin(navigationPlugin);

core.loadDocument('https://cloudpdf.io/example.pdf');

core.on('document:loaded', ({ pageCount }) => {
  console.log(`Document loaded with ${pageCount} pages`);
});

core.on('navigation:pageChanged', ({ pageNumber }) => {
  console.log(`Navigated to page ${pageNumber}`);
});
```
