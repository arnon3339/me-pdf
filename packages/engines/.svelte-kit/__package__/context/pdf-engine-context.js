import { setContext } from 'svelte';
export const pdfEngineKey = Symbol('pdfEngineKey');
export function setEngineContext(ctx) {
    setContext(pdfEngineKey, ctx);
}
