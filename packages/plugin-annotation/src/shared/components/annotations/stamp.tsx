import { MouseEvent, TouchEvent, useState, useRef } from '@framework';
import { PdfStampAnnoObject, Rect } from '@embedpdf/models';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { RenderAnnotation } from '../render-annotation';
import { useAnnotationCapability } from '../../index';

interface StampProps {
  isSelected: boolean;
  annotation: TrackedAnnotation<PdfStampAnnoObject>;
  documentId: string;
  pageIndex: number;
  scale: number;
  onClick: (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => void;
}

export function Stamp({
  isSelected,
  annotation,
  documentId,
  pageIndex,
  scale,
  onClick,
}: StampProps) {
  const { provides: annotationCapability } = useAnnotationCapability();
  const [isResizing, setIsResizing] = useState(false);
  const [currentSize, setCurrentSize] = useState<{ width: number; height: number } | null>(null);

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const startRect = useRef<Rect | null>(null);
  const latestSize = useRef<{ width: number; height: number } | null>(null);

  // Simple corner resize handle (bottom-right)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setCurrentSize(annotation.object.rect.size);
    latestSize.current = annotation.object.rect.size;

    startPos.current = { x: e.clientX, y: e.clientY };
    startRect.current = annotation.object.rect;

    // Capture pointer
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isResizing || !startPos.current || !startRect.current) return;

    const dx = (e.clientX - startPos.current.x) / scale;
    const dy = (e.clientY - startPos.current.y) / scale;

    const newWidth = Math.max(10, startRect.current.size.width + dx);
    const newHeight = Math.max(10, startRect.current.size.height + dy);

    const newSize = { width: newWidth, height: newHeight };
    setCurrentSize(newSize);
    latestSize.current = newSize;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isResizing) {
      if (annotationCapability && startRect.current && latestSize.current) {
        annotationCapability.updateAnnotation(pageIndex, annotation.object.id, {
          rect: {
            ...startRect.current,
            size: latestSize.current
          }
        });
      }

      setIsResizing(false);
      setCurrentSize(null);
      latestSize.current = null;
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  // Use local size if resizing, otherwise use annotation size
  const displayWidth = (isResizing && currentSize ? currentSize.width : annotation.object.rect.size.width) * scale;
  const displayHeight = (isResizing && currentSize ? currentSize.height : annotation.object.rect.size.height) * scale;

  // Construct temporary annotation object for rendering
  const displayAnnotation = isResizing && currentSize ? {
    ...annotation.object,
    rect: {
      ...annotation.object.rect,
      size: currentSize
    }
  } : annotation.object;

  return (
    <div
      style={{
        position: 'absolute',
        width: displayWidth,
        height: displayHeight,
        zIndex: 2,
        pointerEvents: isSelected && !isResizing ? 'auto' : 'auto', // Ensure pointer events work
        cursor: 'pointer',
        border: isSelected ? '1px solid #00aaff' : 'none',
        boxSizing: 'border-box'
      }}
      onPointerDown={onClick}
      onTouchStart={onClick}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <RenderAnnotation
          documentId={documentId}
          pageIndex={pageIndex}
          annotation={{ ...displayAnnotation, id: annotation.object.id }}
          scaleFactor={scale}
        />

        {/* Resize Handle (Bottom Right) */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 10,
              height: 10,
              background: '#00aaff',
              cursor: 'nwse-resize',
              borderRadius: '50%'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        )}
      </div>
    </div>
  );
}
