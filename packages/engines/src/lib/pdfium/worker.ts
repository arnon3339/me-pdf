import { PdfiumEngineRunner } from './runner';

let runner: PdfiumEngineRunner | null = null;

// Listen for initialization message
self.onmessage = async (event) => {
  const { type, wasmUrl } = event.data;

  if (type === 'wasmInit' && wasmUrl && !runner) {
    try {
      const response = await fetch(wasmUrl);
      const wasmBinary = await response.arrayBuffer();
      runner = new PdfiumEngineRunner(wasmBinary);
      await runner.prepare();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      self.postMessage({ type: 'wasmError', error: message });
    }
  }
};
