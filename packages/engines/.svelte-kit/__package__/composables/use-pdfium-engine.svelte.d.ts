import type { Logger, PdfEngine } from '@embedpdf/models';
export interface UsePdfiumEngineProps {
    wasmUrl?: string;
    worker?: boolean;
    logger?: Logger;
}
export declare function usePdfiumEngine(config?: UsePdfiumEngineProps): {
    readonly engine: PdfEngine<Blob> | null;
    readonly isLoading: boolean;
    readonly error: Error | null;
    readonly destroyEngine: () => void;
};
