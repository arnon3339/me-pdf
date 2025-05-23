import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { UIPlugin } from '@embedpdf/plugin-ui';

export const useUI = () => usePlugin<UIPlugin>(UIPlugin.id);
export const useUICapability = () => useCapability<UIPlugin>(UIPlugin.id);
