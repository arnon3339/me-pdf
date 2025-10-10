import { RenderPlugin } from '@embedpdf/plugin-render';
export declare const useRenderPlugin: () => {
    plugin: RenderPlugin | null;
    isLoading: boolean;
    ready: Promise<void>;
};
export declare const useRenderCapability: () => {
    provides: Readonly<import("@embedpdf/plugin-render").RenderCapability> | null;
    isLoading: boolean;
    ready: Promise<void>;
};
