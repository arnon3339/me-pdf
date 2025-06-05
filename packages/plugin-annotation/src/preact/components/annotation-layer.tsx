/** @jsxImportSource preact */
import { ComponentChildren, Fragment, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useAnnotationCapability } from '../hooks';
import { PdfAnnotationObject, PdfAnnotationSubtype, Position } from '@embedpdf/models';
import { getAnnotationsByPageIndex } from '../../lib/selectors';
import { HighlightAnnotation } from './annotations/highlight';
import { usePointerHandlers } from '@embedpdf/plugin-interaction-manager/preact';
import { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';

type AnnotationLayerProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  scale: number;
  style?: JSX.CSSProperties;
};

export function AnnotationLayer({ pageIndex, scale, style, ...props }: AnnotationLayerProps) {
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
    <div
      style={{
        ...style,
      }}
      {...props}
    >
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
    </div>
  );
}
