import { Rect } from '@embedpdf/models';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { JSX } from '@framework';

export type ResizeDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';

export interface SelectionMenuProps {
  annotation: TrackedAnnotation;
  selected: boolean;
  rect: Rect;
}

export type SelectionMenu = (props: SelectionMenuProps) => JSX.Element;
