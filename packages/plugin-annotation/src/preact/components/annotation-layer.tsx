/** @jsxImportSource preact */
import { ComponentChildren, Fragment, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useAnnotationCapability } from '../hooks';
import { PdfAnnotationObject, PdfAnnotationSubtype } from '@embedpdf/models';
import { getAnnotationsByPageIndex } from '../../lib/selectors';
import { HighlightAnnotation } from './annotations/highlight';

type AnnotationLayerProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  scale: number;
  style?: JSX.CSSProperties;
};

export function AnnotationLayer({ pageIndex, scale, style, ...props }: AnnotationLayerProps) {
  const { provides: annotationProvides } = useAnnotationCapability();
  const [annotations, setAnnotations] = useState<PdfAnnotationObject[]>([]);

  useEffect(() => {
    if (annotationProvides) {
      annotationProvides.onStateChange((state) =>
        setAnnotations(getAnnotationsByPageIndex(state, pageIndex)),
      );
    }
  }, [annotationProvides]);

  return (
    <div
      style={{
        ...style,
      }}
      {...props}
    >
      {annotations.map((annotation) => {
        switch (annotation.type) {
          case PdfAnnotationSubtype.HIGHLIGHT:
            return <HighlightAnnotation annotation={annotation} scale={scale} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
