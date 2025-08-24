import { BasePluginConfig } from '@embedpdf/core';
import { PdfErrorReason, Task } from '@embedpdf/models';

export interface ExportPluginConfig extends BasePluginConfig {}

export interface ExportCapability {
  saveAsCopy: () => Task<ArrayBuffer, PdfErrorReason>;
  download: () => void;
}
