import { BasePlugin, createEmitter, Listener, PluginRegistry, Unsubscribe } from '@embedpdf/core';
import {
  PdfErrorCode,
  PdfErrorReason,
  PdfPrintOptions,
  PdfTaskHelper,
  Task,
} from '@embedpdf/models';

import { PrintCapability, PrintPluginConfig, PrintProgress, PrintRequest } from './types';

export class PrintPlugin extends BasePlugin<PrintPluginConfig, PrintCapability> {
  static readonly id = 'print' as const;

  private readonly printRequest$ = createEmitter<PrintRequest>();

  constructor(id: string, registry: PluginRegistry, _config: PrintPluginConfig) {
    super(id, registry);
  }

  async initialize(_: PrintPluginConfig): Promise<void> {}

  protected buildCapability(): PrintCapability {
    return {
      print: this.print.bind(this),
    };
  }

  public onPrintRequest(listener: Listener<PrintRequest>): Unsubscribe {
    return this.printRequest$.on(listener);
  }

  private print(options: PdfPrintOptions): Task<ArrayBuffer, PdfErrorReason, PrintProgress> {
    const task = new Task<ArrayBuffer, PdfErrorReason, PrintProgress>();

    // Emit progress immediately
    task.progress({ stage: 'preparing', message: 'Preparing document...' });

    // Create the print request with the task
    const request: PrintRequest = {
      options,
      task,
    };

    // Emit the request
    this.printRequest$.emit(request);

    return task;
  }

  public preparePrintDocument(options: PdfPrintOptions): Task<ArrayBuffer, PdfErrorReason> {
    const document = this.coreState.core.document;

    if (!document) {
      return PdfTaskHelper.reject({
        code: PdfErrorCode.DocNotOpen,
        message: 'Document not found',
      });
    }

    return this.engine.preparePrintDocument(document, options);
  }
}
