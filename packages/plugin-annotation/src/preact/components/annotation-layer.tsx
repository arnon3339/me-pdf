/** @jsxImportSource preact */
import { ComponentChildren, Fragment, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useAnnotationCapability } from '../hooks';
import { ignore, PdfErrorCode } from '@embedpdf/models';

type AnnotationLayerProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  style?: JSX.CSSProperties;
};

export function AnnotationLayer({ pageIndex, style, ...props }: AnnotationLayerProps) {
  const { provides: annotationProvides } = useAnnotationCapability();

  useEffect(() => {
    if (annotationProvides) {
      const task = annotationProvides.getPageAnnotations({ pageIndex });
      task.wait((annotations) => {
        console.log(annotations);
      }, ignore);
    }
  }, [annotationProvides]);

  return (
    <div
      style={{
        ...style,
      }}
      {...props}
    ></div>
  );
}
