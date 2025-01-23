import { PdfPageObject } from "@cloudpdf/models";

export interface ILayer {
  id: string;
  zIndex: number;
  render(page: PdfPageObject, container: HTMLElement): Promise<void>;
  destroy(): void;
}