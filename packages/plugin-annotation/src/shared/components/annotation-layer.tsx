import { HTMLAttributes, CSSProperties } from '@framework';
import { Annotations } from './annotations';
import { TextMarkup } from './text-markup';
import { SelectionMenu, ResizeHandleUI, VertexHandleUI } from '../types';
import { AnnotationPaintLayer } from './annotation-paint-layer';

type AnnotationLayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
  pageIndex: number;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  rotation: number;
  /** Customize selection menu across all annotations on this layer */
  selectionMenu?: SelectionMenu;
  style?: CSSProperties;
  /** Customize resize handles */
  resizeUI?: ResizeHandleUI;
  /** Customize vertex handles */
  vertexUI?: VertexHandleUI;
  /** Customize selection outline color */
  selectionOutlineColor?: string;
};

export function AnnotationLayer({
  style,
  pageIndex,
  scale,
  selectionMenu,
  resizeUI,
  vertexUI,
  pageWidth,
  pageHeight,
  rotation,
  selectionOutlineColor,
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
        resizeUI={resizeUI}
        vertexUI={vertexUI}
        selectionOutlineColor={selectionOutlineColor}
      />
      <TextMarkup pageIndex={pageIndex} scale={scale} />
      <AnnotationPaintLayer pageIndex={pageIndex} scale={scale} />
    </div>
  );
}
