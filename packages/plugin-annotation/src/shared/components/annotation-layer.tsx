import { HTMLAttributes, CSSProperties } from '@framework';
import { Annotations } from './annotations';
import { TextMarkup } from './text-markup';
import { InkPaint } from './annotations/ink-paint';

type AnnotationLayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  rotation: number;
  style?: CSSProperties;
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
