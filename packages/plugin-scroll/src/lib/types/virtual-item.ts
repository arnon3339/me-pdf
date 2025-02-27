import { PdfPageObject } from "@embedpdf/models";

export class VirtualItem {
  constructor(
    public readonly pageNumbers: number[],
    public readonly pages: PdfPageObject[],
    public readonly index: number,
    public readonly size: number,
    public offset: number,
    private getScaleFactor: () => number = () => 1
  ) {}

  get scaledSize(): number {
    return this.size * this.getScaleFactor();
  }

  get scaledOffset(): number {
    return this.offset * this.getScaleFactor();
  }
} 