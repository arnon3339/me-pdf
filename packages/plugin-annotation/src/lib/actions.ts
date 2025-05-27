import { Action } from '@embedpdf/core';
import { PdfAnnotationObject, PdfAlphaColor, PdfAnnotationSubtype } from '@embedpdf/models';
import { SelectedAnnotation } from './types';

export const SET_ANNOTATIONS = 'SET_ANNOTATIONS';
export const SELECT_ANNOTATION = 'SELECT_ANNOTATION';
export const DESELECT_ANNOTATION = 'DESELECT_ANNOTATION';
export const SET_ANNOTATION_MODE = 'SET_ANNOTATION_MODE';
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

export interface SetAnnotationModeAction extends Action {
  type: typeof SET_ANNOTATION_MODE;
  payload: PdfAnnotationSubtype | null;
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
  | SetAnnotationModeAction
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

export function setAnnotationMode(mode: PdfAnnotationSubtype | null): SetAnnotationModeAction {
  return {
    type: SET_ANNOTATION_MODE,
    payload: mode,
  };
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
