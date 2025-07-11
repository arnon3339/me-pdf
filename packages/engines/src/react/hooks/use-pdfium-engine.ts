import { useEffect, useRef, useState } from 'react';
import { Logger, PdfEngine } from '@embedpdf/models';

interface UsePdfiumEngineProps {
  wasmUrl: string;
  worker?: boolean;
  logger?: Logger;
}

export function usePdfiumEngine({ wasmUrl, worker = true, logger }: UsePdfiumEngineProps) {
  const [engine, setEngine] = useState<PdfEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const engineRef = useRef<{ destroy(): void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { createPdfiumEngine } = worker
          ? await import('@embedpdf/engines/pdfium-worker-engine')
          : await import('@embedpdf/engines/pdfium-direct-engine');

        const pdfEngine = await createPdfiumEngine(wasmUrl, logger);
        engineRef.current = pdfEngine;
        setEngine(pdfEngine);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e as Error);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [wasmUrl, worker, logger]);

  return { engine, isLoading: loading, error };
}
