import { BasePluginConfig } from '@embedpdf/core';
import { PdfPageObject } from '@embedpdf/models';

export interface SpreadPluginConfig extends BasePluginConfig {
  defaultSpreadMode?: SpreadMode;
}

export enum SpreadMode {
  None = 'none',
  Odd = 'odd',
  Even = 'even',
}

export interface SpreadCapability {
  onSpreadChange(handler: (spreadMode: SpreadMode) => void): void;
  setSpreadMode(mode: SpreadMode): void;
  getSpreadMode(): SpreadMode;
  getSpreadPagesObjects(pages: PdfPageObject[]): PdfPageObject[][];
}

export interface SpreadState {
  spreadMode: SpreadMode;
}
