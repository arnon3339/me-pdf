/** @jsxImportSource preact */
import { ComponentChildren } from 'preact';
import {
  PdfHighlightAnnoObject,
  PdfSquigglyAnnoObject,
  PdfUnderlineAnnoObject,
  PdfStrikeOutAnnoObject,
} from '@embedpdf/models';
import { useCallback } from 'preact/hooks';
import { useAnnotationCapability } from '../hooks';

interface SelectableAnnotationContainerProps {
  annotation:
    | PdfHighlightAnnoObject
    | PdfUnderlineAnnoObject
    | PdfStrikeOutAnnoObject
    | PdfSquigglyAnnoObject;
  scale: number;
  isSelected?: boolean;
  pageIndex: number;
  children: ComponentChildren;
}

export function SelectableAnnotationContainer({
  annotation,
  scale,
  isSelected = false,
  pageIndex,
  children,
}: SelectableAnnotationContainerProps) {
  const { provides: annotationProvides } = useAnnotationCapability();

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
      {children}
      <div
        className="markup-annotation"
        style={{
          position: 'absolute',
          mixBlendMode: 'multiply',
          cursor: 'pointer',
          outline: isSelected ? '2px solid #007ACC' : 'none',
          outlineOffset: isSelected ? '1px' : '0px',
          left: `${annotation.rect.origin.x * scale}px`,
          top: `${annotation.rect.origin.y * scale}px`,
          width: `${annotation.rect.size.width * scale}px`,
          height: `${annotation.rect.size.height * scale}px`,
          zIndex: 1,
        }}
        onMouseDown={handleClick}
      />
    </>
  );
}
