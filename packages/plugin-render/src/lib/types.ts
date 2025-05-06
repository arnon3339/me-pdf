import { BasePluginConfig } from "@embedpdf/core";
import { PdfErrorReason } from "@embedpdf/models";
import { Task } from "@embedpdf/models";

export interface RenderPluginConfig extends BasePluginConfig {

}

export interface RenderCapability {
  renderPage: (pageIndex: number, scaleFactor: number, dpr: number) => Task<Blob, PdfErrorReason>;
} 