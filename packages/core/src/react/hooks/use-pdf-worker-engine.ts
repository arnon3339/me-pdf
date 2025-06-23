import { useEffect, useState, useRef } from 'react';
import { WebWorkerEngine } from '@embedpdf/engines/worker';
import { PdfEngine } from '@embedpdf/models';

interface UsePdfWorkerEngineProps {
  workerUrl: string | URL;
}

export function usePdfWorkerEngine({ workerUrl }: UsePdfWorkerEngineProps) {
  const [engine, setEngine] = useState<PdfEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeEngine() {
      try {
        // Create the worker
        const worker = new Worker(workerUrl, { type: 'module' });

        workerRef.current = worker;

        // Create the engine
        const pdfEngine = new WebWorkerEngine(worker);

        if (isMounted) {
          pdfEngine.readyTask.wait(
            () => {
              setEngine(pdfEngine);
              setIsLoading(false);
            },
            (error) => {
              setError(new Error(error.reason.message));
              setIsLoading(false);
            },
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize PDF engine'));
          setIsLoading(false);
        }
      }
    }

    initializeEngine();

    // Cleanup function
    return () => {
      isMounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [workerUrl]);

  return { engine, isLoading, error };
}
