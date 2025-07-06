/** @jsxImportSource preact */
import { JSX } from 'preact';
import { PdfAnnotationSubtype, Rect } from '@embedpdf/models';
import { ActiveTool } from '@embedpdf/plugin-annotation';
import { useSelectionCapability } from '@embedpdf/plugin-selection/preact';

import { useEffect, useState } from 'preact/hooks';
import { useAnnotationCapability } from '../hooks';
import { Highlight } from './text-markup/highlight';
import { Squiggly } from './text-markup/squiggly';
import { Underline } from './text-markup/underline';
import { Strikeout } from './text-markup/strikeout';

interface TextMarkupProps {
  pageIndex: number;
  scale: number;
}

export function TextMarkup({ pageIndex, scale }: TextMarkupProps) {
  const { provides: selectionProvides } = useSelectionCapability();
  const { provides: annotationProvides } = useAnnotationCapability();
  const [rects, setRects] = useState<Array<Rect>>([]);
  const [activeTool, setActiveTool] = useState<ActiveTool>({ mode: null, defaults: null });

  useEffect(() => {
    if (!selectionProvides) return;

    const off = selectionProvides.onSelectionChange(() => {
      setRects(selectionProvides.getHighlightRectsForPage(pageIndex));
    });
    return off;
  }, [selectionProvides, pageIndex]);

  useEffect(() => {
    if (!annotationProvides) return;

    const off = annotationProvides.onActiveToolChange(setActiveTool);
    return off;
  }, [annotationProvides]);

  switch (activeTool.mode) {
    case PdfAnnotationSubtype.UNDERLINE:
      return (
        <Underline
          color={activeTool.defaults?.color}
          opacity={activeTool.defaults?.opacity}
          rects={rects}
          scale={scale}
        />
      );
    case PdfAnnotationSubtype.HIGHLIGHT:
      return (
        <Highlight
          color={activeTool.defaults?.color}
          opacity={activeTool.defaults?.opacity}
          rects={rects}
          scale={scale}
        />
      );
    case PdfAnnotationSubtype.STRIKEOUT:
      return (
        <Strikeout
          color={activeTool.defaults?.color}
          opacity={activeTool.defaults?.opacity}
          rects={rects}
          scale={scale}
        />
      );
    case PdfAnnotationSubtype.SQUIGGLY:
      return (
        <Squiggly
          color={activeTool.defaults?.color}
          opacity={activeTool.defaults?.opacity}
          rects={rects}
          scale={scale}
        />
      );
    default:
      return null;
  }
}
