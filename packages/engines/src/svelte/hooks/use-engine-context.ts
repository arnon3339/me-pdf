import type { PdfEngine } from '@embedpdf/models';

export interface PdfEngineContextState {
  engine: PdfEngine | null;
  isLoading: boolean;
  error: Error | null;
}

export const engineContext = $state<PdfEngineContextState>({
  engine: null,
  isLoading: true,
  error: null,
});

/**
 * Composable to access the PDF engine from context.
 * @returns The PDF engine context state
 * @throws Error if used outside of PdfEngineProvider
 */
export function useEngineContext(): PdfEngineContextState {
  return engineContext;
}

/**
 * Composable to access the PDF engine, with a more convenient API.
 * @returns The PDF engine or null if loading/error
 */
export function useEngine() {
  if (engineContext.error) {
    throw engineContext.error;
  }

  return engineContext.engine;
}
