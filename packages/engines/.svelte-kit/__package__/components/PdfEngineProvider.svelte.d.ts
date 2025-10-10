import { type Snippet } from 'svelte';
import type { PdfEngine } from '@embedpdf/models';
export interface PdfEngineProviderProps {
    children: Snippet;
    engine: PdfEngine | null;
    isLoading: boolean;
    error: Error | null;
}
declare const PdfEngineProvider: import("svelte").Component<PdfEngineProviderProps, {}, "">;
type PdfEngineProvider = ReturnType<typeof PdfEngineProvider>;
export default PdfEngineProvider;
