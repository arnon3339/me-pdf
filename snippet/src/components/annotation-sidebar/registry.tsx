import { PdfAnnotationSubtype, PdfAnnotationObject } from '@embedpdf/models';
import { SidebarPropsBase } from './common';
import { InkSidebar } from './ink-sidebar';
import { TextMarkupSidebar } from './text-markup-sidebar';
import { ShapeSidebar } from './shape-sidebar';
import { PolygonSidebar } from './polygon-sidebar';

/* 1.  Component type that matches the subtype it is registered for */
type SidebarComponent<S extends PdfAnnotationSubtype> = (
  p: SidebarPropsBase<Extract<PdfAnnotationObject, { type: S }>>,
) => JSX.Element | null;

/* 2.  Registry type */
type SidebarRegistry = Partial<{
  [K in PdfAnnotationSubtype]: SidebarComponent<K>;
}>;

/* 3.  Implementation */
export const SIDEbars: SidebarRegistry = {
  /* Ink */
  [PdfAnnotationSubtype.INK]: InkSidebar,
  [PdfAnnotationSubtype.POLYGON]: PolygonSidebar,

  /* text-markup */
  [PdfAnnotationSubtype.HIGHLIGHT]: TextMarkupSidebar,
  [PdfAnnotationSubtype.UNDERLINE]: TextMarkupSidebar,
  [PdfAnnotationSubtype.STRIKEOUT]: TextMarkupSidebar,
  [PdfAnnotationSubtype.SQUIGGLY]: TextMarkupSidebar,

  /* shapes */
  [PdfAnnotationSubtype.SQUARE]: ShapeSidebar,
  [PdfAnnotationSubtype.CIRCLE]: ShapeSidebar,
};
