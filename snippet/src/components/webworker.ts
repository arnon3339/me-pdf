import { PdfiumEngineRunner } from '@embedpdf/engines';

let runner: PdfiumEngineRunner | null = null;

// Listen for initialization message
self.onmessage = async (event) => {
  const { type, wasmUrl } = event.data;

  if (type === 'INIT_WASM' && wasmUrl && !runner) {
    try {
      const response = await fetch(wasmUrl);
      const wasmBinary = await response.arrayBuffer();
      runner = new PdfiumEngineRunner(wasmBinary);
      runner.prepare();

      // Notify that initialization is complete
      self.postMessage({ type: 'WASM_READY' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      self.postMessage({ type: 'WASM_ERROR', error: message });
    }
  }
};
