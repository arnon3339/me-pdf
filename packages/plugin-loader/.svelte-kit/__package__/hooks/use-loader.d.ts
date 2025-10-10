import { LoaderPlugin } from '@embedpdf/plugin-loader';
export declare const useLoaderPlugin: () => {
    plugin: LoaderPlugin | null;
    isLoading: boolean;
    ready: Promise<void>;
};
export declare const useLoaderCapability: () => {
    provides: Readonly<import("@embedpdf/plugin-loader").LoaderCapability> | null;
    isLoading: boolean;
    ready: Promise<void>;
};
