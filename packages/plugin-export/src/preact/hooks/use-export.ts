import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { ExportPlugin } from '@embedpdf/plugin-export';

export const useExport = () => usePlugin<ExportPlugin>(ExportPlugin.id);
export const useExportCapability = () => useCapability<ExportPlugin>(ExportPlugin.id);
