import { ViewportPlugin } from '@embedpdf/plugin-viewport';
export declare const useViewportPlugin: () => {
    plugin: ViewportPlugin | null;
    isLoading: boolean;
    ready: Promise<void>;
};
export declare const useViewportCapability: () => {
    provides: Readonly<import("@embedpdf/plugin-viewport").ViewportCapability> | null;
    isLoading: boolean;
    ready: Promise<void>;
};
