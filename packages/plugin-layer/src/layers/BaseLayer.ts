import { PdfPageObject } from "@embedpdf/models";
import { ILayer } from "../types";
import { IPDFCore } from "@embedpdf/core";

export abstract class BaseLayer implements ILayer {
  abstract readonly id: string;
  abstract readonly zIndex: number;
  
  protected core?: IPDFCore;

  async initialize(core: IPDFCore): Promise<void> {
    this.core = core;
  }

  abstract render(page: PdfPageObject, container: HTMLElement): Promise<void>;
  
  async destroy(): Promise<void> {
    this.core = undefined;
  }
}