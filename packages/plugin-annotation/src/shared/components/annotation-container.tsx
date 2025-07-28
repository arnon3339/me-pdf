import {
  JSX,
  HTMLAttributes,
  CSSProperties,
  useEffect,
  useRef,
  useState,
  PointerEvent,
  Fragment,
} from '@framework';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { PdfAnnotationObject, Position, Rect, restoreOffset } from '@embedpdf/models';
import { useAnnotationCapability } from '../hooks';
import { ResizeDirection, SelectionMenuProps } from '../../shared/types';
import { CounterRotate } from './counter-rotate-container';
import { VertexEditor } from './vertex-editor';
import { ComputePatch, PatchContext } from '../patchers';

type AnnotationContainerProps<T extends PdfAnnotationObject> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'style' | 'children'
> & {
  scale: number;
  isSelected?: boolean;
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  rotation: number;
  trackedAnnotation: TrackedAnnotation<T>;
  children: JSX.Element | ((annotation: T) => JSX.Element);
  style?: CSSProperties;
  isDraggable?: boolean;
  isResizable?: boolean;
  outlineOffset?: number;
  selectionMenu?: (props: SelectionMenuProps) => JSX.Element;
  computeVertices?: (annotation: T) => Position[];
  computePatch?: ComputePatch<T>;
};

type Point = { x: number; y: number };

export function AnnotationContainer<T extends PdfAnnotationObject>({
  scale,
  pageIndex,
  rotation,
  pageWidth,
  pageHeight,
  trackedAnnotation,
  children,
  style,
  outlineOffset = 1,
  isSelected = false,
  isDraggable = true,
  isResizable = true,
  computeVertices,
  computePatch,
  selectionMenu,
  ...props
}: AnnotationContainerProps<T>): JSX.Element {
  const { provides: annotationProvides } = useAnnotationCapability();
  const ref = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<'idle' | 'dragging' | 'resizing'>('idle');
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [startPos, setStartPos] = useState<Point | null>(null);
  const [startRect, setStartRect] = useState<Rect | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect>(trackedAnnotation.object.rect);
  const [currentVertices, setCurrentVertices] = useState<Position[]>(
    computeVertices?.(trackedAnnotation.object) ?? [],
  );
  const [previewObject, setPreviewObject] = useState<Partial<T> | null>(null);

  // Helper function to clamp values within bounds
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // Page size in PDF-space (unscaled)
  const pageWidthPDF = pageWidth / scale;
  const pageHeightPDF = pageHeight / scale;

  useEffect(() => {
    setCurrentRect(trackedAnnotation.object.rect);
    setCurrentVertices(computeVertices?.(trackedAnnotation.object) ?? []);
    setPreviewObject(null);
  }, [trackedAnnotation]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!isSelected) return;

    e.stopPropagation();
    e.preventDefault();

    const target = e.target as HTMLElement;

    if (isResizable && target.classList.contains('resize-handle')) {
      setDragState('resizing');
      setResizeDirection(target.dataset.direction as ResizeDirection);
    } else if (isDraggable) {
      setDragState('dragging');
    } else {
      return;
    }

    setStartPos({ x: e.clientX, y: e.clientY });
    setStartRect(currentRect);

    ref.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragState === 'idle' || !startPos || !startRect) return;

    const dispDelta = { x: e.clientX - startPos.x, y: e.clientY - startPos.y };
    const { x: dx, y: dy } = restoreOffset(dispDelta, rotation, scale);

    let newOriginX = startRect.origin.x;
    let newOriginY = startRect.origin.y;
    let newWidth = startRect.size.width;
    let newHeight = startRect.size.height;

    if (dragState === 'dragging') {
      newOriginX += dx;
      newOriginY += dy;
    } else if (dragState === 'resizing' && resizeDirection) {
      if (resizeDirection.includes('right')) {
        newWidth += dx;
      } else if (resizeDirection.includes('left')) {
        newOriginX += dx;
        newWidth -= dx;
      }

      if (resizeDirection.includes('bottom')) {
        newHeight += dy;
      } else if (resizeDirection.includes('top')) {
        newOriginY += dy;
        newHeight -= dy;
      }

      // Prevent negative dimensions
      if (newWidth < 1 || newHeight < 1) return;
    }

    // Apply boundary constraints to keep annotation within page bounds
    // Clamp width and height first
    newWidth = clamp(newWidth, 1, pageWidthPDF);
    newHeight = clamp(newHeight, 1, pageHeightPDF);

    // Then clamp position to ensure annotation stays within bounds
    newOriginX = clamp(newOriginX, 0, pageWidthPDF - newWidth);
    newOriginY = clamp(newOriginY, 0, pageHeightPDF - newHeight);

    const tentativeRect = {
      origin: { x: newOriginX, y: newOriginY },
      size: { width: newWidth, height: newHeight },
    };

    let previewPatch: Partial<T> = { rect: tentativeRect } as Partial<T>;

    if (computePatch) {
      const dir = dragState === 'resizing' ? resizeDirection : 'bottom-right';
      previewPatch = computePatch(trackedAnnotation.object, {
        rect: tentativeRect,
        direction: dir || undefined,
      });
      setCurrentVertices(computeVertices?.({ ...trackedAnnotation.object, ...previewPatch }) ?? []);
    }

    setCurrentRect(previewPatch.rect || tentativeRect);
    setPreviewObject(previewPatch);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragState === 'idle') return;

    const usedDirection = resizeDirection || 'bottom-right';
    setDragState('idle');
    setResizeDirection(null);

    ref.current?.releasePointerCapture(e.pointerId);

    // Commit the changes
    if (annotationProvides && trackedAnnotation) {
      const patch: Partial<T> = computePatch
        ? computePatch(trackedAnnotation.object, {
            rect: currentRect,
            direction: usedDirection,
          })
        : ({ rect: currentRect } as Partial<T>);
      annotationProvides.updateAnnotation(pageIndex, trackedAnnotation.localId, patch);
    }

    setStartPos(null);
    setStartRect(null);
    setPreviewObject(null);
  };

  const currentObject = previewObject
    ? { ...trackedAnnotation.object, ...previewObject }
    : trackedAnnotation.object;

  return (
    <Fragment>
      <div
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'absolute',
          outline: isSelected ? '1px solid #007ACC' : 'none',
          outlineOffset: isSelected ? `${outlineOffset}px` : '0px',
          left: `${currentRect.origin.x * scale}px`,
          top: `${currentRect.origin.y * scale}px`,
          width: `${currentRect.size.width * scale}px`,
          height: `${currentRect.size.height * scale}px`,
          pointerEvents: isSelected ? 'auto' : 'none',
          cursor: isSelected && isDraggable ? 'move' : 'default',
          ...style,
        }}
        {...props}
      >
        {typeof children === 'function' ? children(currentObject) : children}
        {isSelected && currentVertices.length > 0 && (
          <VertexEditor
            rect={currentRect}
            rotation={rotation}
            scale={scale}
            vertices={currentVertices}
            onEdit={(v) => {
              setCurrentVertices(v);
              if (computePatch) {
                const patch = computePatch(trackedAnnotation.object, {
                  rect: currentRect,
                  vertices: v,
                });
                setPreviewObject(patch);
                setCurrentRect(patch.rect || currentRect);
              }
            }}
            onCommit={(v) => {
              if (annotationProvides && computePatch) {
                const patch = computePatch(trackedAnnotation.object, {
                  rect: currentRect,
                  vertices: v,
                });
                annotationProvides.updateAnnotation(pageIndex, trackedAnnotation.localId, patch);
              }
            }}
          />
        )}
        {isSelected && isResizable && (
          <>
            <div
              className="resize-handle"
              data-direction="top-left"
              style={{
                position: 'absolute',
                top: -7 - outlineOffset,
                left: -7 - outlineOffset,
                width: 13,
                height: 13,
                background: 'blue',
                borderRadius: '50%',
                cursor: rotation % 2 ? 'nesw-resize' : 'nwse-resize',
              }}
            />
            <div
              className="resize-handle"
              data-direction="top-right"
              style={{
                position: 'absolute',
                top: -7 - outlineOffset,
                right: -7 - outlineOffset,
                width: 13,
                height: 13,
                background: 'blue',
                borderRadius: '50%',
                cursor: rotation % 2 ? 'nwse-resize' : 'nesw-resize',
              }}
            />
            <div
              className="resize-handle"
              data-direction="bottom-left"
              style={{
                position: 'absolute',
                bottom: -7 - outlineOffset,
                left: -7 - outlineOffset,
                width: 13,
                height: 13,
                background: 'blue',
                borderRadius: '50%',
                cursor: rotation % 2 ? 'nwse-resize' : 'nesw-resize',
              }}
            />
            <div
              className="resize-handle"
              data-direction="bottom-right"
              style={{
                position: 'absolute',
                bottom: -7 - outlineOffset,
                right: -7 - outlineOffset,
                width: 13,
                height: 13,
                background: 'blue',
                borderRadius: '50%',
                cursor: rotation % 2 ? 'nesw-resize' : 'nwse-resize',
              }}
            />
          </>
        )}
      </div>
      <CounterRotate
        rect={{
          origin: { x: currentRect.origin.x * scale, y: currentRect.origin.y * scale },
          size: { width: currentRect.size.width * scale, height: currentRect.size.height * scale },
        }}
        rotation={rotation}
      >
        {({ rect, menuWrapperProps }) =>
          selectionMenu &&
          selectionMenu({
            annotation: trackedAnnotation,
            selected: isSelected,
            rect,
            menuWrapperProps,
          })
        }
      </CounterRotate>
    </Fragment>
  );
}
