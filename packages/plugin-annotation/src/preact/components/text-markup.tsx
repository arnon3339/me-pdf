import { PdfAnnotationSubtype, Rect } from '@embedpdf/models';
import {
  AnnotationDefaults,
  HighlightDefaults,
  StylableSubtype,
} from '@embedpdf/plugin-annotation';
import { useSelectionCapability } from '@embedpdf/plugin-selection/preact';
import { useEffect, useState } from 'preact/hooks';
import { useAnnotationCapability } from '../hooks';
import { Highlight } from './text-markup/highlight';

interface TextMarkupProps {
  pageIndex: number;
  scale: number;
}

interface ActiveToolState {
  mode: StylableSubtype;
  defaults: AnnotationDefaults;
}

export function TextMarkup({ pageIndex, scale }: TextMarkupProps) {
  const { provides: selectionProvides } = useSelectionCapability();
  const { provides: annotationProvides } = useAnnotationCapability();
  const [rects, setRects] = useState<Array<Rect>>([]);
  const [activeTool, setActiveTool] = useState<ActiveToolState | null>(null);

  useEffect(() => {
    if (!selectionProvides) return;
    if (!annotationProvides) return;

    const selectionChange = selectionProvides.onSelectionChange(() => {
      setRects(selectionProvides.getHighlightRectsForPage(pageIndex));
    });

    const modeChange = annotationProvides.onModeChange((mode) => {
      setActiveTool(
        mode
          ? {
              mode,
              defaults: annotationProvides.getToolDefaults(mode),
            }
          : null,
      );
    });

    return () => {
      selectionChange();
      modeChange();
    };
  }, [selectionProvides, annotationProvides, pageIndex]);

  if (!activeTool) return null;

  const renderTextMarkup = () => {
    switch (activeTool.mode) {
      case PdfAnnotationSubtype.HIGHLIGHT:
        return (
          <Highlight
            activeTool={activeTool.defaults as HighlightDefaults}
            rects={rects}
            scale={scale}
          />
        );
      default:
        return null;
    }
  };

  console.log(activeTool);
  console.log(rects);

  return <>{renderTextMarkup()}</>;
}
