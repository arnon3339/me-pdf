import { HTMLAttributes, CSSProperties } from '@framework';
import { Annotations } from './annotations';
import { TextMarkup } from './text-markup';
import { InkPaint } from './annotations/ink-paint';
import { SelectionMenu } from '../types';

type AnnotationLayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  rotation: number;
  selectionMenu?: SelectionMenu;
  style?: CSSProperties;
};

export function AnnotationLayer({
  pageIndex,
  scale,
  pageWidth,
  pageHeight,
  rotation,
  selectionMenu,
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
      <Annotations
        selectionMenu={selectionMenu}
        pageIndex={pageIndex}
        scale={scale}
        rotation={rotation}
        pageWidth={pageWidth}
        pageHeight={pageHeight}
      />
      <TextMarkup pageIndex={pageIndex} scale={scale} />
      <InkPaint pageIndex={pageIndex} scale={scale} pageWidth={pageWidth} pageHeight={pageHeight} />
    </div>
  );
}
