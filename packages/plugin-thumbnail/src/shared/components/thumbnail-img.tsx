import { useEffect, useState, useRef, HTMLAttributes, CSSProperties } from '@framework';
import { ThumbMeta } from '@embedpdf/plugin-thumbnail';
import { ignore, PdfErrorCode } from '@embedpdf/models';
import { useThumbnailCapability } from '../hooks';

type ThumbnailImgProps = Omit<HTMLAttributes<HTMLImageElement>, 'style'> & {
  style?: CSSProperties;
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
