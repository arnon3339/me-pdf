/** @jsxImportSource preact */
import { ComponentChildren, Fragment, JSX } from 'preact';
import { PdfHighlightAnnoObject } from '@embedpdf/models';
import { useCallback } from 'preact/hooks';
import { useAnnotationCapability } from '../../hooks';

interface HighlightAnnotationProps {
  annotation: PdfHighlightAnnoObject;
  scale: number;
  isSelected?: boolean;
  pageIndex: number;
}

export function HighlightAnnotation({
  annotation,
  scale,
  isSelected = false,
  pageIndex,
}: HighlightAnnotationProps) {
  const { provides: annotationProvides } = useAnnotationCapability();

  // Default highlight color if none is specified
  const highlightColor = annotation.color || '#FFFF00';
  const highlightOpacity = annotation.opacity || 0.5;

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (annotationProvides) {
        annotationProvides.selectAnnotation(pageIndex, annotation.id);
      }
    },
    [annotationProvides, isSelected, pageIndex, annotation.id],
  );

  return (
    <>
      <div
        className="highlight-annotation"
        style={{
          position: 'absolute',
          mixBlendMode: 'multiply',
          cursor: 'pointer',
          outline: isSelected ? '2px solid #007ACC' : 'none',
          left: `${annotation.rect.origin.x * scale}px`,
          top: `${annotation.rect.origin.y * scale}px`,
          width: `${annotation.rect.size.width * scale}px`,
          height: `${annotation.rect.size.height * scale}px`,
        }}
        onMouseDown={handleClick}
      >
        {annotation.segmentRects.map((rect, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${(rect.origin.x - annotation.rect.origin.x) * scale}px`,
              top: `${(rect.origin.y - annotation.rect.origin.y) * scale}px`,
              width: `${rect.size.width * scale}px`,
              height: `${rect.size.height * scale}px`,
              backgroundColor: highlightColor,
              opacity: highlightOpacity,
            }}
          />
        ))}
      </div>
    </>
  );
}
