/** @jsxImportSource preact */
import { Fragment, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ignore, PdfAnnotationObject, PdfErrorCode } from '@embedpdf/models';

import { useAnnotationCapability } from '../hooks/use-annotation';

type RenderAnnotationProps = Omit<JSX.HTMLAttributes<HTMLImageElement>, 'style'> & {
  pageIndex: number;
  annotation: PdfAnnotationObject;
  scaleFactor?: number;
  dpr?: number;
  style?: JSX.CSSProperties;
};

export function RenderAnnotation({
  pageIndex,
  annotation,
  scaleFactor = 1,
  dpr = 1,
  style,
  ...props
}: RenderAnnotationProps) {
  const { provides: annotationProvides } = useAnnotationCapability();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (annotationProvides) {
      const task = annotationProvides.renderAnnotation({ pageIndex, annotation, scaleFactor, dpr });
      task.wait((blob) => {
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        urlRef.current = url;
      }, ignore);

      return () => {
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
        } else {
          task.abort({
            code: PdfErrorCode.Cancelled,
            message: 'canceled render task',
          });
        }
      };
    }
  }, [pageIndex, scaleFactor, dpr, annotationProvides, annotation]);

  const handleImageLoad = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  return (
    <Fragment>
      {imageUrl && (
        <img
          src={imageUrl}
          onLoad={handleImageLoad}
          {...props}
          style={{
            width: '100%',
            height: '100%',
            ...(style || {}),
          }}
        />
      )}
    </Fragment>
  );
}
