/** @jsxImportSource preact */
import { JSX } from 'preact';
import { Annotations } from './annotations';
import { TextMarkup } from './text-markup';
import { InkPaint } from './annotations/ink-paint';

type AnnotationLayerProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  rotation: number;
  style?: JSX.CSSProperties;
};

export function AnnotationLayer({
  pageIndex,
  scale,
  pageWidth,
  pageHeight,
  rotation,
  style,
  ...props
}: AnnotationLayerProps) {
  return (
    <div
      style={{
        ...style,
      }}
      {...props}
    >
      <Annotations pageIndex={pageIndex} scale={scale} rotation={rotation} />
      <TextMarkup pageIndex={pageIndex} scale={scale} />
      <InkPaint pageIndex={pageIndex} scale={scale} pageWidth={pageWidth} pageHeight={pageHeight} />
    </div>
  );
}
