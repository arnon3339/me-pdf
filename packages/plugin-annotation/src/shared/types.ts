import { PdfAnnotationObject, Position, Rect } from '@embedpdf/models';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { HandleElementProps, MenuWrapperProps } from '@embedpdf/utils/@framework';
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

export type HandleProps = HandleElementProps & {
  backgroundColor?: string;
};

/** UI customization for resize handles */
export interface ResizeHandleUI {
  /** Handle size in CSS px (default: 12) */
  size?: number;
  /** Default background color for the handle (used by default renderer) */
  color?: string;
  /** Custom renderer for each handle (overrides default) */
  component?: (p: HandleProps) => JSX.Element;
}

/** UI customization for vertex handles */
export interface VertexHandleUI {
  /** Handle size in CSS px (default: 12) */
  size?: number;
  /** Default background color for the handle (used by default renderer) */
  color?: string;
  /** Custom renderer for each vertex (overrides default) */
  component?: (p: HandleProps) => JSX.Element;
}
