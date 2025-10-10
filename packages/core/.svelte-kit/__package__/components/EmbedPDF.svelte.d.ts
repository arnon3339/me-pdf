import type { Logger, PdfEngine } from '@embedpdf/models';
import { type IPlugin, type PluginBatchRegistration, PluginRegistry } from '@embedpdf/core';
import { type Snippet } from 'svelte';
import { type PDFContextState } from "../context";
interface EmbedPDFProps {
    /**
     * The PDF engine to use for the PDF viewer.
     */
    engine: PdfEngine;
    /**
     * The logger to use for the PDF viewer.
     */
    logger?: Logger;
    /**
     * The callback to call when the PDF viewer is initialized.
     */
    onInitialized?: (registry: PluginRegistry) => Promise<void>;
    /**
     * The plugins to use for the PDF viewer.
     */
    plugins: PluginBatchRegistration<IPlugin<any>, any>[];
    /**
     * The children to render for the PDF viewer.
     */
    children: Snippet<[PDFContextState]>;
    /**
     * Whether to auto-mount specific non-visual DOM elements from plugins.
     * @default true
     */
    autoMountDomElements?: boolean;
}
declare const EmbedPDF: import("svelte").Component<EmbedPDFProps, {}, "">;
type EmbedPDF = ReturnType<typeof EmbedPDF>;
export default EmbedPDF;
