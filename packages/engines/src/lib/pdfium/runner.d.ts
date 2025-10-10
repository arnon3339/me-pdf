import { EngineRunner } from '../webworker/runner';
import { Logger } from '@embedpdf/models';
/**
 * EngineRunner for pdfium-based wasm engine
 */
export declare class PdfiumEngineRunner extends EngineRunner {
    private wasmBinary;
    /**
     * Create an instance of PdfiumEngineRunner
     * @param wasmBinary - wasm binary that contains the pdfium wasm file
     */
    constructor(wasmBinary: ArrayBuffer, logger?: Logger);
    /**
     * Initialize runner
     */
    prepare(): Promise<void>;
}
