import { Action } from '@embedpdf/core';
import { PdfAnnotationObject, PdfAlphaColor } from '@embedpdf/models';
import { SelectedAnnotation } from './types';

export const SET_ANNOTATIONS = 'SET_ANNOTATIONS';
export const SELECT_ANNOTATION = 'SELECT_ANNOTATION';
export const DESELECT_ANNOTATION = 'DESELECT_ANNOTATION';
export const SET_EDIT_MODE = 'SET_EDIT_MODE';
export const UPDATE_ANNOTATION_COLOR = 'UPDATE_ANNOTATION_COLOR';

export interface SetAnnotationsAction extends Action {
  type: typeof SET_ANNOTATIONS;
  payload: Record<number, PdfAnnotationObject[]>;
}

export interface SelectAnnotationAction extends Action {
  type: typeof SELECT_ANNOTATION;
  payload: SelectedAnnotation;
}

export interface DeselectAnnotationAction extends Action {
  type: typeof DESELECT_ANNOTATION;
}

export interface SetEditModeAction extends Action {
  type: typeof SET_EDIT_MODE;
  payload: boolean;
}

export interface UpdateAnnotationColorAction extends Action {
  type: typeof UPDATE_ANNOTATION_COLOR;
  payload: {
    pageIndex: number;
    annotationId: number;
    color: PdfAlphaColor;
  };
}

export type AnnotationAction =
  | SetAnnotationsAction
  | SelectAnnotationAction
  | DeselectAnnotationAction
  | SetEditModeAction
  | UpdateAnnotationColorAction;

export function setAnnotations(
  payload: Record<number, PdfAnnotationObject[]>,
): SetAnnotationsAction {
  return { type: SET_ANNOTATIONS, payload };
}

export function selectAnnotation(
  pageIndex: number,
  annotationId: number,
  annotation: PdfAnnotationObject,
): SelectAnnotationAction {
  return {
    type: SELECT_ANNOTATION,
    payload: { pageIndex, annotationId, annotation },
  };
}

export function deselectAnnotation(): DeselectAnnotationAction {
  return { type: DESELECT_ANNOTATION };
}

export function setEditMode(enabled: boolean): SetEditModeAction {
  return { type: SET_EDIT_MODE, payload: enabled };
}

export function updateAnnotationColor(
  pageIndex: number,
  annotationId: number,
  color: PdfAlphaColor,
): UpdateAnnotationColorAction {
  return {
    type: UPDATE_ANNOTATION_COLOR,
    payload: { pageIndex, annotationId, color },
  };
}
