/** @jsxImportSource preact */
import { JSX } from 'preact';
import { PdfAnnotationObject, PdfAnnotationSubtype } from '@embedpdf/models';
import { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';
import { usePointerHandlers } from '@embedpdf/plugin-interaction-manager/preact';
import { getAnnotationsByPageIndex } from '@embedpdf/plugin-annotation';
import { useAnnotationCapability } from '../hooks';
import { HighlightAnnotation } from './annotations/highlight';
import { useMemo, useState, useEffect } from 'preact/hooks';

interface AnnotationsProps {
  pageIndex: number;
  scale: number;
}

export function Annotations({ pageIndex, scale }: AnnotationsProps) {
  const { provides: annotationProvides } = useAnnotationCapability();
  const [annotations, setAnnotations] = useState<PdfAnnotationObject[]>([]);
  const { register } = usePointerHandlers({ pageIndex });
  const [selectionState, setSelectionState] = useState<{
    selectedPageIndex: number | undefined;
    selectedAnnotationId: number | undefined;
  }>({ selectedPageIndex: undefined, selectedAnnotationId: undefined });

  useEffect(() => {
    if (annotationProvides) {
      annotationProvides.onStateChange((state) => {
        setAnnotations(getAnnotationsByPageIndex(state, pageIndex));
        setSelectionState({
          selectedPageIndex: state.selectedAnnotation?.pageIndex,
          selectedAnnotationId: state.selectedAnnotation?.annotationId,
        });
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
        const isSelected =
          selectionState.selectedPageIndex === pageIndex &&
          selectionState.selectedAnnotationId === annotation.id;

        switch (annotation.type) {
          case PdfAnnotationSubtype.HIGHLIGHT:
            return (
              <HighlightAnnotation
                key={annotation.id}
                annotation={annotation}
                scale={scale}
                isSelected={isSelected}
                pageIndex={pageIndex}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
