/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Annotations } from './annotations';
import { TextMarkup } from './text-markup';

type AnnotationLayerProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  scale: number;
  style?: JSX.CSSProperties;
};

export function AnnotationLayer({ pageIndex, scale, style, ...props }: AnnotationLayerProps) {
  return (
    <div
      style={{
        ...style,
      }}
      {...props}
    >
      <Annotations pageIndex={pageIndex} scale={scale} />
      <TextMarkup pageIndex={pageIndex} scale={scale} />
    </div>
  );
}
