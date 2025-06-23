import { useEffect, useRef, useState } from 'react';
import { PdfEngine } from '@embedpdf/models';

interface UsePdfiumEngineProps {
  wasmUrl: string;
  worker?: boolean;
}

export function usePdfiumEngine({ wasmUrl, worker = true }: UsePdfiumEngineProps) {
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

        const pdfEngine = await createPdfiumEngine(wasmUrl);
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
  }, [wasmUrl, worker]);

  return { engine, isLoading: loading, error };
}
