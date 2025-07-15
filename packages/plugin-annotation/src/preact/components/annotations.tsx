/** @jsxImportSource preact */
import { JSX } from 'preact';
import { PdfAnnotationSubtype, PdfInkAnnoObject } from '@embedpdf/models';
import { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';
import { usePointerHandlers } from '@embedpdf/plugin-interaction-manager/preact';
import {
  getAnnotationsByPageIndex,
  getSelectedAnnotationByPageIndex,
  TrackedAnnotation,
} from '@embedpdf/plugin-annotation';
import { useAnnotationCapability } from '../hooks';
import { useMemo, useState, useEffect, useCallback } from 'preact/hooks';
import { AnnotationContainer } from './annotation-container';
import { Highlight } from './text-markup/highlight';
import { Underline } from './text-markup/underline';
import { Strikeout } from './text-markup/strikeout';
import { Squiggly } from './text-markup/squiggly';
import { Ink } from './annotations/ink';
import { useSelectionCapability } from '@embedpdf/plugin-selection/preact';
import { resizeInkAnnotation } from '../../shared/resize-ink';

interface AnnotationsProps {
  pageIndex: number;
  scale: number;
  rotation: number;
}

export function Annotations(annotationsProps: AnnotationsProps) {
  const { pageIndex, scale } = annotationsProps;
  const { provides: annotationProvides } = useAnnotationCapability();
  const { provides: selectionProvides } = useSelectionCapability();
  const [annotations, setAnnotations] = useState<TrackedAnnotation[]>([]);
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

  const handleClick = useCallback(
    (e: MouseEvent, annotation: TrackedAnnotation) => {
      e.stopPropagation();
      if (annotationProvides && selectionProvides) {
        annotationProvides.selectAnnotation(pageIndex, annotation.localId);
        selectionProvides.clear();
      }
    },
    [annotationProvides, selectionProvides, pageIndex],
  );

  useEffect(() => {
    return register(handlers);
  }, [register, handlers]);

  return (
    <>
      {annotations.map((annotation) => {
        const isSelected = selectionState?.localId === annotation.localId;

        switch (annotation.object.type) {
          case PdfAnnotationSubtype.UNDERLINE:
            return (
              <AnnotationContainer
                key={annotation.localId}
                trackedAnnotation={annotation}
                isSelected={isSelected}
                isDraggable={false}
                isResizable={false}
                style={{ mixBlendMode: 'multiply' }}
                {...annotationsProps}
              >
                <Underline
                  rect={annotation.object.rect}
                  color={annotation.object.color}
                  opacity={annotation.object.opacity}
                  rects={annotation.object.segmentRects}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              </AnnotationContainer>
            );
          case PdfAnnotationSubtype.STRIKEOUT:
            return (
              <AnnotationContainer
                key={annotation.localId}
                trackedAnnotation={annotation}
                isSelected={isSelected}
                isDraggable={false}
                isResizable={false}
                style={{ mixBlendMode: 'multiply' }}
                {...annotationsProps}
              >
                <Strikeout
                  rect={annotation.object.rect}
                  color={annotation.object.color}
                  opacity={annotation.object.opacity}
                  rects={annotation.object.segmentRects}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              </AnnotationContainer>
            );
          case PdfAnnotationSubtype.SQUIGGLY:
            return (
              <AnnotationContainer
                key={annotation.localId}
                trackedAnnotation={annotation}
                isSelected={isSelected}
                isDraggable={false}
                isResizable={false}
                style={{ mixBlendMode: 'multiply' }}
                {...annotationsProps}
              >
                <Squiggly
                  color={annotation.object.color}
                  opacity={annotation.object.opacity}
                  rects={annotation.object.segmentRects}
                  rect={annotation.object.rect}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              </AnnotationContainer>
            );
          case PdfAnnotationSubtype.HIGHLIGHT:
            return (
              <AnnotationContainer
                key={annotation.localId}
                trackedAnnotation={annotation}
                isSelected={isSelected}
                isDraggable={false}
                isResizable={false}
                style={{ mixBlendMode: 'multiply' }}
                {...annotationsProps}
              >
                <Highlight
                  color={annotation.object.color}
                  opacity={annotation.object.opacity}
                  rects={annotation.object.segmentRects}
                  scale={scale}
                  rect={annotation.object.rect}
                  onClick={(e) => handleClick(e, annotation)}
                />
              </AnnotationContainer>
            );
          case PdfAnnotationSubtype.INK:
            return (
              <AnnotationContainer
                key={annotation.localId}
                isSelected={isSelected}
                trackedAnnotation={annotation}
                outlineOffset={6}
                computeResizePatch={resizeInkAnnotation}
                {...annotationsProps}
              >
                {(obj: PdfInkAnnoObject) => (
                  <Ink
                    color={obj.color}
                    opacity={obj.opacity}
                    strokeWidth={obj.strokeWidth}
                    inkList={obj.inkList}
                    rect={obj.rect}
                    scale={scale}
                    onClick={(e) => handleClick(e, annotation)}
                  />
                )}
              </AnnotationContainer>
            );
          /*
          case PdfAnnotationSubtype.SQUARE:
            return (
              <Square
                color={annotation.object.color}
                opacity={annotation.object.opacity}
                rect={annotation.object.rect}
                scale={scale}
                strokeColor={annotation.object.strokeColor}
                strokeWidth={1}
                intensity={annotation.object.cloudyBorderIntensity || 0}
                inset={annotation.object.cloudyBorderInset || [0, 0, 0, 0]}
              />
            );
            */
          default:
            return null;
        }
      })}
    </>
  );
}
