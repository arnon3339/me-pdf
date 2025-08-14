import { BasePlugin, createEmitter, PluginRegistry } from '@embedpdf/core';
import { PdfEngine, PdfErrorCode, PdfErrorReason, PdfTaskHelper, Task } from '@embedpdf/models';

import { ExportCapability, ExportPluginConfig } from './types';

export class ExportPlugin extends BasePlugin<ExportPluginConfig, ExportCapability> {
  static readonly id = 'export' as const;

  private readonly downloadRequest$ = createEmitter<'download'>();

  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(_: ExportPluginConfig): Promise<void> {}

  protected buildCapability(): ExportCapability {
    return {
      saveAsCopy: this.saveAsCopy.bind(this),
      download: this.download.bind(this),
      onRequest: this.downloadRequest$.on,
    };
  }

  private download(): void {
    this.downloadRequest$.emit('download');
  }

  private saveAsCopy(): Task<ArrayBuffer, PdfErrorReason> {
    const document = this.coreState.core.document;

    if (!document)
      return PdfTaskHelper.reject({
        code: PdfErrorCode.DocNotOpen,
        message: 'Document not found',
      });

    return this.engine.saveAsCopy(document);
  }
}
