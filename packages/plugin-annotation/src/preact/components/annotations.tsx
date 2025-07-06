/** @jsxImportSource preact */
import { JSX } from 'preact';
import { PdfAnnotationObject, PdfAnnotationSubtype } from '@embedpdf/models';
import { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';
import { usePointerHandlers } from '@embedpdf/plugin-interaction-manager/preact';
import {
  getAnnotationsByPageIndex,
  getSelectedAnnotationByPageIndex,
  TrackedAnnotation,
} from '@embedpdf/plugin-annotation';
import { useAnnotationCapability } from '../hooks';
import { useMemo, useState, useEffect } from 'preact/hooks';
import { SelectableAnnotationContainer } from './selectable-container';
import { Highlight } from './text-markup/highlight';
import { Underline } from './text-markup/underline';
import { Strikeout } from './text-markup/strikeout';
import { Squiggly } from './text-markup/squiggly';

interface AnnotationsProps {
  pageIndex: number;
  scale: number;
}

export function Annotations({ pageIndex, scale }: AnnotationsProps) {
  const { provides: annotationProvides } = useAnnotationCapability();
  const [annotations, setAnnotations] = useState<PdfAnnotationObject[]>([]);
  const { register } = usePointerHandlers({ pageIndex });
  const [selectionState, setSelectionState] = useState<TrackedAnnotation | null>(null);

  useEffect(() => {
    if (annotationProvides) {
      annotationProvides.onStateChange((state) => {
        setAnnotations(getAnnotationsByPageIndex(state, pageIndex));
        setSelectionState(getSelectedAnnotationByPageIndex(state, pageIndex));
      });
    }
  }, [annotationProvides]);

  const handlers = useMemo(
    (): PointerEventHandlers<MouseEvent> => ({
      onPointerDown: (_, pe) => {
        // Only deselect if clicking directly on the layer (not on an annotation)
        if (pe.target === pe.currentTarget && annotationProvides) {
          annotationProvides.deselectAnnotation();
        }
      },
    }),
    [annotationProvides],
  );

  useEffect(() => {
    return register(handlers);
  }, [register, handlers]);

  return (
    <>
      {annotations.map((annotation) => {
        const isSelected = selectionState?.object.id === annotation.id;

        switch (annotation.type) {
          case PdfAnnotationSubtype.UNDERLINE:
            return (
              <SelectableAnnotationContainer
                key={annotation.id}
                annotation={annotation}
                scale={scale}
                isSelected={isSelected}
                pageIndex={pageIndex}
              >
                <Underline
                  color={annotation.color}
                  opacity={annotation.opacity}
                  rects={annotation.segmentRects}
                  scale={scale}
                />
              </SelectableAnnotationContainer>
            );
          case PdfAnnotationSubtype.STRIKEOUT:
            return (
              <SelectableAnnotationContainer
                key={annotation.id}
                annotation={annotation}
                scale={scale}
                isSelected={isSelected}
                pageIndex={pageIndex}
              >
                <Strikeout
                  color={annotation.color}
                  opacity={annotation.opacity}
                  rects={annotation.segmentRects}
                  scale={scale}
                />
              </SelectableAnnotationContainer>
            );
          case PdfAnnotationSubtype.SQUIGGLY:
            return (
              <SelectableAnnotationContainer
                key={annotation.id}
                annotation={annotation}
                scale={scale}
                isSelected={isSelected}
                pageIndex={pageIndex}
              >
                <Squiggly
                  color={annotation.color}
                  opacity={annotation.opacity}
                  rects={annotation.segmentRects}
                  scale={scale}
                />
              </SelectableAnnotationContainer>
            );
          case PdfAnnotationSubtype.HIGHLIGHT:
            return (
              <SelectableAnnotationContainer
                key={annotation.id}
                annotation={annotation}
                scale={scale}
                isSelected={isSelected}
                pageIndex={pageIndex}
              >
                <Highlight
                  color={annotation.color}
                  opacity={annotation.opacity}
                  rects={annotation.segmentRects}
                  scale={scale}
                />
              </SelectableAnnotationContainer>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
