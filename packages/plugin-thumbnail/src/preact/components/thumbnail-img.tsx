/** @jsxImportSource preact */
import { ComponentChildren, Fragment, JSX } from 'preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { ThumbMeta } from '@embedpdf/plugin-thumbnail';
import { ignore, PdfErrorCode } from '@embedpdf/models';
import { useThumbnailCapability } from '../hooks';

type ThumbnailImgProps = Omit<JSX.HTMLAttributes<HTMLImageElement>, 'style'> & {
  style?: JSX.CSSProperties;
  meta: ThumbMeta;
};

export function ThumbImg({ meta, style, ...props }: ThumbnailImgProps) {
  const { provides: thumbs } = useThumbnailCapability();
  const [url, setUrl] = useState<string>();
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const task = thumbs?.renderThumb(meta.pageIndex, window.devicePixelRatio);
    task?.wait((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      setUrl(objectUrl);
    }, ignore);

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      } else {
        task?.abort({
          code: PdfErrorCode.Cancelled,
          message: 'canceled render task',
        });
      }
    };
  }, [meta.pageIndex]);

  const handleImageLoad = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  return url ? <img src={url} onLoad={handleImageLoad} style={style} {...props} /> : null;
}
