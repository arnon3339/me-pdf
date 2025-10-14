import { ignore, Logger, PdfEngine } from '@embedpdf/models';
import { DEFAULT_PDFIUM_WASM_URL } from '@embedpdf/engines';
import { engineContext } from './use-engine-context';
import { useEffect } from '@framework';

export interface UsePdfiumEngineProps {
  wasmUrl?: string;
  worker?: boolean;
  logger?: Logger;
}

export function usePdfiumEngine(config?: UsePdfiumEngineProps) {
  const { wasmUrl = DEFAULT_PDFIUM_WASM_URL, worker = true, logger } = config ?? {};

  let engineRef = $state<PdfEngine | null>();
  let token = 0;

  async function loadEngine() {
    const myToken = ++token;
    engineContext.isLoading = true;
    engineContext.error = null;

    try {
      const { createPdfiumEngine } = worker
        ? await import('@embedpdf/engines/pdfium-worker-engine')
        : await import('@embedpdf/engines/pdfium-direct-engine');
      const pdfEngine = await createPdfiumEngine(wasmUrl, logger);

      if (myToken !== token) {
        pdfEngine?.destroy?.();
        return;
      }

      engineRef = pdfEngine;
      engineContext.engine = pdfEngine;
      engineContext.isLoading = false;
    } catch (e) {
      if (myToken !== token) return;
      engineContext.error = e as Error;
      engineContext.isLoading = false;
    }
  }

  useEffect(() => {
    if (wasmUrl || worker || logger) {
      let cancelled = false;

      (async () => {
        try {
          const { createPdfiumEngine } = worker
            ? await import('@embedpdf/engines/pdfium-worker-engine')
            : await import('@embedpdf/engines/pdfium-direct-engine');

          const pdfEngine = await createPdfiumEngine(wasmUrl, logger);
          engineRef = pdfEngine;
          pdfEngine.initialize().wait(
            () => {
              engineContext.engine = pdfEngine;
              engineContext.isLoading = false;
            },
            (e) => {
              engineContext.error = new Error(e.reason.message);
              engineContext.isLoading = false;
            },
          );
        } catch (e) {
          if (!cancelled) {
            engineContext.error = e as Error;
            engineContext.isLoading = false;
          }
        }
      })();

      return () => {
        cancelled = true;
        engineRef?.closeAllDocuments?.().wait(() => {
          engineRef?.destroy?.();
          engineRef = null;
        }, ignore);
      };
    }
  });

  return engineContext;
}
