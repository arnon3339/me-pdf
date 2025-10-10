import type { HTMLImgAttributes } from 'svelte/elements';
interface RenderLayerProps extends Omit<HTMLImgAttributes, 'style'> {
    pageIndex: number;
    /**
     * The scale factor for rendering the page.
     */
    scale?: number;
    dpr?: number;
    class?: string;
}
declare const RenderLayer: import("svelte").Component<RenderLayerProps, {}, "">;
type RenderLayer = ReturnType<typeof RenderLayer>;
export default RenderLayer;
