import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { SpreadPlugin } from '@embedpdf/plugin-spread';

export const useSpread = () => usePlugin<SpreadPlugin>(SpreadPlugin.id);
export const useSpreadCapability = () => useCapability<SpreadPlugin>(SpreadPlugin.id);
