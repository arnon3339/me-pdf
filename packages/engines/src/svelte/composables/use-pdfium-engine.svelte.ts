import type { Logger, PdfEngine } from '@embedpdf/models';
import { DEFAULT_PDFIUM_WASM_URL } from '@embedpdf/engines';

export interface UsePdfiumEngineProps {
  wasmUrl?: string;
  worker?: boolean;
  logger?: Logger;
}

export function usePdfiumEngine(config?: UsePdfiumEngineProps) {
  const { wasmUrl = DEFAULT_PDFIUM_WASM_URL, worker = true, logger } = config ?? {};

  let engine = $state<PdfEngine | null>(null);
  let isLoading = $state(true);
  let error = $state<Error | null>(null);

  let current: { destroy?: () => void } | null = null;
  let token = 0;

  async function loadEngine() {
    const myToken = ++token;
    isLoading = true;
    error = null;

    try {
      const { createPdfiumEngine } = worker
        ? await import('@embedpdf/engines/pdfium-worker-engine')
        : await import('@embedpdf/engines/pdfium-direct-engine');
      const pdfEngine = await createPdfiumEngine(wasmUrl, logger);

      if (myToken !== token) {
        pdfEngine?.destroy?.();
        return;
      }

      current = pdfEngine;
      engine = pdfEngine;
      isLoading = false;
    } catch (e) {
      if (myToken !== token) return;
      error = e as Error;
      isLoading = false;
    }
  }

  function destroyEngine() {
    token++; // cancel in-flight
    try {
      current?.destroy?.();
    } finally {
      current = null;
      engine = null;
      isLoading = true;
      error = null;
    }
  }
  $effect(() => {
    if (wasmUrl || worker || logger) {
      loadEngine();
    }
    return () => {
      destroyEngine();
    };
  });

  // IMPORTANT: expose *getters* so consumers read live state
  return {
    get engine() {
      return engine;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    get destroyEngine() {
      return destroyEngine;
    },
  };
}
