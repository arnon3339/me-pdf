import { getContext, setContext } from 'svelte';
export const pdfKey = Symbol('pdfKey');
export function setPDFContext(ctx) {
    setContext(pdfKey, ctx);
}
export function getPDFContext() {
    const ctx = getContext(pdfKey);
    if (!ctx)
        throw new Error('getPDFContext must be used inside <EmbedPDF>');
    return ctx;
}
