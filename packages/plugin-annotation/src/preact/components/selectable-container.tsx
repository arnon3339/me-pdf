/** @jsxImportSource preact */
import { ComponentChildren } from 'preact';
import { useCallback } from 'preact/hooks';
import { useAnnotationCapability } from '../hooks';
import { useSelectionCapability } from '@embedpdf/plugin-selection/preact';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';

interface SelectableAnnotationContainerProps {
  trackedAnnotation: TrackedAnnotation;
  scale: number;
  isSelected?: boolean;
  pageIndex: number;
  children: ComponentChildren;
}

export function SelectableAnnotationContainer({
  trackedAnnotation,
  scale,
  isSelected = false,
  pageIndex,
  children,
}: SelectableAnnotationContainerProps) {
  const { provides: annotationProvides } = useAnnotationCapability();
  const { provides: selectionProvides } = useSelectionCapability();
  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (annotationProvides && selectionProvides) {
        annotationProvides.selectAnnotation(pageIndex, trackedAnnotation.localId);
        selectionProvides.clear();
      }
    },
    [annotationProvides, selectionProvides, isSelected, pageIndex, trackedAnnotation.localId],
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
          left: `${trackedAnnotation.object.rect.origin.x * scale}px`,
          top: `${trackedAnnotation.object.rect.origin.y * scale}px`,
          width: `${trackedAnnotation.object.rect.size.width * scale}px`,
          height: `${trackedAnnotation.object.rect.size.height * scale}px`,
          zIndex: 1,
        }}
        onMouseDown={handleClick}
      />
    </>
  );
}
