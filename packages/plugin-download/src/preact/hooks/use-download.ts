import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { DownloadPlugin } from '@embedpdf/plugin-download';

export const useDownload = () => usePlugin<DownloadPlugin>(DownloadPlugin.id);
export const useDownloadCapability = () => useCapability<DownloadPlugin>(DownloadPlugin.id);
