/** @jsxImportSource preact */
import { ComponentChildren, Fragment, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useRender } from '../hooks/use-render';

type RenderLayoutProps = Omit<JSX.HTMLAttributes<HTMLImageElement>, 'style'> & {
  pageIndex: number;
  scaleFactor?: number;
  dpr?: number;
  style?: JSX.CSSProperties;
};

export function RenderLayer({ pageIndex, scaleFactor = 1, dpr = 1, style, ...props }: RenderLayoutProps) {
  const renderPlugin = useRender();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (renderPlugin) {
      const task = renderPlugin.renderPage(pageIndex, scaleFactor, dpr);
      task.wait((blob) => {
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        urlRef.current = url;
      }, (reason) => {
        console.error(reason);
      });
    }

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [pageIndex, scaleFactor, dpr, renderPlugin]);

  const handleImageLoad = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  return <Fragment>
    {imageUrl && (
      <img
        src={imageUrl}
        onLoad={handleImageLoad}
        {...props}
        style={{
          width: '100%',
          height: '100%',
          ...((style) || {})
        }}
      />
    )}
  </Fragment>;
}