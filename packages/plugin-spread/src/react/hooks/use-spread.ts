import { useCapability, usePlugin } from '@embedpdf/core/react';
import { SpreadPlugin } from '@embedpdf/plugin-spread';

export const useSpreadPlugin = () => usePlugin<SpreadPlugin>(SpreadPlugin.id);
export const useSpreadCapability = () => useCapability<SpreadPlugin>(SpreadPlugin.id);
