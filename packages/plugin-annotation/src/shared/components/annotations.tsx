import { blendModeToCss, PdfBlendMode } from '@embedpdf/models';
import {
  getAnnotationsByPageIndex,
  getSelectedAnnotationByPageIndex,
  isHighlight,
  isInk,
  isSquiggly,
  isCircle,
  isStrikeout,
  isUnderline,
  TrackedAnnotation,
  isSquare,
} from '@embedpdf/plugin-annotation';
import { PointerEventHandlers } from '@embedpdf/plugin-interaction-manager';
import { usePointerHandlers } from '@embedpdf/plugin-interaction-manager/@framework';
import { useSelectionCapability } from '@embedpdf/plugin-selection/@framework';
import { useMemo, useState, useEffect, useCallback, MouseEvent } from '@framework';

import { useAnnotationCapability } from '../hooks';
import { AnnotationContainer } from './annotation-container';
import { Highlight } from './text-markup/highlight';
import { Underline } from './text-markup/underline';
import { Strikeout } from './text-markup/strikeout';
import { Squiggly } from './text-markup/squiggly';
import { Ink } from './annotations/ink';
import { Square } from './annotations/square';
import { SelectionMenu } from '../types';
import { Circle } from './annotations/circle';
import { resizeInkAnnotation } from '../resize-ink';

interface AnnotationsProps {
  pageIndex: number;
  scale: number;
  rotation: number;
  pageWidth: number;
  pageHeight: number;
  selectionMenu?: SelectionMenu;
}

export function Annotations(annotationsProps: AnnotationsProps) {
  const { pageIndex, scale, selectionMenu } = annotationsProps;
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

        if (isInk(annotation)) {
          return (
            <AnnotationContainer
              key={annotation.localId}
              trackedAnnotation={annotation}
              isSelected={isSelected}
              isDraggable={true}
              isResizable={true}
              selectionMenu={selectionMenu}
              computeResizePatch={resizeInkAnnotation}
              style={{
                mixBlendMode: blendModeToCss(annotation.object.blendMode ?? PdfBlendMode.Normal),
              }}
              {...annotationsProps}
            >
              {(obj) => (
                <Ink
                  cursor={isSelected ? 'move' : 'pointer'}
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
        }

        if (isSquare(annotation)) {
          return (
            <AnnotationContainer
              key={annotation.localId}
              trackedAnnotation={annotation}
              isSelected={isSelected}
              isDraggable={true}
              isResizable={true}
              selectionMenu={selectionMenu}
              style={{
                mixBlendMode: blendModeToCss(annotation.object.blendMode ?? PdfBlendMode.Normal),
              }}
              {...annotationsProps}
            >
              {(obj) => (
                <Square
                  cursor={isSelected ? 'move' : 'pointer'}
                  rect={obj.rect}
                  color={obj.color}
                  opacity={obj.opacity}
                  strokeWidth={obj.strokeWidth}
                  strokeColor={obj.strokeColor}
                  strokeStyle={obj.strokeStyle}
                  strokeDashArray={obj.strokeDashArray}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              )}
            </AnnotationContainer>
          );
        }

        if (isCircle(annotation)) {
          return (
            <AnnotationContainer
              key={annotation.localId}
              trackedAnnotation={annotation}
              isSelected={isSelected}
              isDraggable={true}
              isResizable={true}
              selectionMenu={selectionMenu}
              style={{
                mixBlendMode: blendModeToCss(annotation.object.blendMode ?? PdfBlendMode.Normal),
              }}
              {...annotationsProps}
            >
              {(obj) => (
                <Circle
                  cursor={isSelected ? 'move' : 'pointer'}
                  rect={obj.rect}
                  color={obj.color}
                  opacity={obj.opacity}
                  strokeWidth={obj.strokeWidth}
                  strokeColor={obj.strokeColor}
                  strokeStyle={obj.strokeStyle}
                  strokeDashArray={obj.strokeDashArray}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              )}
            </AnnotationContainer>
          );
        }

        if (isUnderline(annotation)) {
          return (
            <AnnotationContainer
              key={annotation.localId}
              trackedAnnotation={annotation}
              isSelected={isSelected}
              isDraggable={false}
              isResizable={false}
              selectionMenu={selectionMenu}
              style={{
                mixBlendMode: blendModeToCss(annotation.object.blendMode ?? PdfBlendMode.Normal),
              }}
              {...annotationsProps}
            >
              {(obj) => (
                <Underline
                  rect={obj.rect}
                  color={obj.color}
                  opacity={obj.opacity}
                  rects={obj.segmentRects}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              )}
            </AnnotationContainer>
          );
        }

        if (isStrikeout(annotation)) {
          return (
            <AnnotationContainer
              key={annotation.localId}
              trackedAnnotation={annotation}
              isSelected={isSelected}
              isDraggable={false}
              isResizable={false}
              selectionMenu={selectionMenu}
              style={{
                mixBlendMode: blendModeToCss(annotation.object.blendMode ?? PdfBlendMode.Normal),
              }}
              {...annotationsProps}
            >
              {(obj) => (
                <Strikeout
                  rect={obj.rect}
                  color={obj.color}
                  opacity={obj.opacity}
                  rects={obj.segmentRects}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              )}
            </AnnotationContainer>
          );
        }

        if (isSquiggly(annotation)) {
          return (
            <AnnotationContainer
              key={annotation.localId}
              trackedAnnotation={annotation}
              isSelected={isSelected}
              isDraggable={false}
              isResizable={false}
              selectionMenu={selectionMenu}
              style={{
                mixBlendMode: blendModeToCss(annotation.object.blendMode ?? PdfBlendMode.Normal),
              }}
              {...annotationsProps}
            >
              {(obj) => (
                <Squiggly
                  color={obj.color}
                  opacity={obj.opacity}
                  rects={obj.segmentRects}
                  rect={obj.rect}
                  scale={scale}
                  onClick={(e) => handleClick(e, annotation)}
                />
              )}
            </AnnotationContainer>
          );
        }

        if (isHighlight(annotation)) {
          return (
            <AnnotationContainer
              key={annotation.localId}
              trackedAnnotation={annotation}
              isSelected={isSelected}
              isDraggable={false}
              isResizable={false}
              selectionMenu={selectionMenu}
              style={{
                mixBlendMode: blendModeToCss(annotation.object.blendMode ?? PdfBlendMode.Multiply),
              }}
              {...annotationsProps}
            >
              {(obj) => (
                <Highlight
                  color={obj.color}
                  opacity={obj.opacity}
                  rects={obj.segmentRects}
                  scale={scale}
                  rect={obj.rect}
                  onClick={(e) => handleClick(e, annotation)}
                />
              )}
            </AnnotationContainer>
          );
        }

        /* --------- fallback: an unsupported subtype --------------- */
        return null;
      })}
    </>
  );
}
