import { BasePluginConfig } from '@embedpdf/core';
import { PdfErrorReason, Task } from '@embedpdf/models';

export interface RedactionPluginConfig extends BasePluginConfig {}

export interface RedactionCapability {
  redactCurrentSelection: () => Task<boolean, PdfErrorReason>;
}
