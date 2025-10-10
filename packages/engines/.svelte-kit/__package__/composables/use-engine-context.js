import { pdfEngineKey } from '../context/pdf-engine-context';
import { getContext } from 'svelte';
/**
 * Composable to access the PDF engine from context.
 * @returns The PDF engine context state
 * @throws Error if used outside of PdfEngineProvider
 */
export function useEngineContext() {
    const ctx = getContext(pdfEngineKey);
    if (!ctx)
        throw new Error('useEngineContext must be used within a PdfEngineProvider');
    return ctx;
}
/**
 * Composable to access the PDF engine, with a more convenient API.
 * @returns The PDF engine or null if loading/error
 */
export function useEngine() {
    const engineContext = useEngineContext();
    if (engineContext.error) {
        throw engineContext.error;
    }
    return engineContext.engine;
}
