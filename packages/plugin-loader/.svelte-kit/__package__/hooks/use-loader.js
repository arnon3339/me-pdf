import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { LoaderPlugin } from '@embedpdf/plugin-loader';
export const useLoaderPlugin = () => usePlugin(LoaderPlugin.id);
export const useLoaderCapability = () => useCapability(LoaderPlugin.id);
