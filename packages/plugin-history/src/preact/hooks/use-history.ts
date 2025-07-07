import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { HistoryPlugin } from '@embedpdf/plugin-history';

export const useHistoryPlugin = () => usePlugin<HistoryPlugin>(HistoryPlugin.id);
export const useHistoryCapability = () => useCapability<HistoryPlugin>(HistoryPlugin.id);
