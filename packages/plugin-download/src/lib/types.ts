import { BasePluginConfig, EventHook } from '@embedpdf/core';
import { PdfErrorReason, Task } from '@embedpdf/models';

export interface DownloadPluginConfig extends BasePluginConfig {}

export interface DownloadCapability {
  saveAsCopy: () => Task<ArrayBuffer, PdfErrorReason>;
  download: () => void;
  onRequest: EventHook<'download'>;
}
