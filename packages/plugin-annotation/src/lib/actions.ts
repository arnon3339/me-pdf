import { Action } from '@embedpdf/core';
import { PdfAnnotationObject } from '@embedpdf/models';

export const SET_ANNOTATIONS = 'SET_ANNOTATIONS';

export interface SetAnnotationsAction extends Action {
  type: typeof SET_ANNOTATIONS;
  payload: Record<number, PdfAnnotationObject[]>;
}

export type AnnotationAction = SetAnnotationsAction;

export function setAnnotations(
  payload: Record<number, PdfAnnotationObject[]>,
): SetAnnotationsAction {
  return { type: SET_ANNOTATIONS, payload };
}
