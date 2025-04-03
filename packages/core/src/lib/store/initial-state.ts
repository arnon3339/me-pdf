import { PdfDocumentObject, PdfPageObject, Rotation } from "@embedpdf/models";

export interface CoreState {
  scale: number;
  rotation: Rotation;
  document: PdfDocumentObject | null;
  loading: boolean;
  error: string | null;
}

export const initialCoreState: CoreState = {
  scale: 1,
  rotation: Rotation.Degree0,
  document: null,
  loading: false,
  error: null
};