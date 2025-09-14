import { PdfAnnotationObject, Position, Rect } from '@embedpdf/models';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { MenuWrapperProps } from '@embedpdf/utils/@framework';
import { JSX } from '@framework';

export type ResizeDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';

export interface SelectionMenuProps {
  annotation: TrackedAnnotation;
  selected: boolean;
  rect: Rect;
  menuWrapperProps: MenuWrapperProps;
}

export type SelectionMenu = (props: SelectionMenuProps) => JSX.Element;

/**
 * Interface for vertex configuration - handles annotation-specific vertex logic
 */
export interface VertexConfig<T extends PdfAnnotationObject> {
  /** Extract vertices from annotation - handles different vertex formats */
  extractVertices: (annotation: T) => Position[];
  /** Transform annotation when vertices change */
  transformAnnotation: (annotation: T, vertices: Position[]) => Partial<T>;
}
