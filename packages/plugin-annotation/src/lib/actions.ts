import { Action } from '@embedpdf/core';
import { PdfAnnotationObject, PdfAnnotationSubtype, WebAlphaColor } from '@embedpdf/models';
import { SelectedAnnotation, StylableSubtype, ToolDefaultsBySubtype } from './types';

export const SET_ANNOTATIONS = 'SET_ANNOTATIONS';
export const SELECT_ANNOTATION = 'SELECT_ANNOTATION';
export const DESELECT_ANNOTATION = 'DESELECT_ANNOTATION';
export const SET_ANNOTATION_MODE = 'SET_ANNOTATION_MODE';
export const UPDATE_ANNOTATION_COLOR = 'UPDATE_ANNOTATION_COLOR';
export const UPDATE_TOOL_DEFAULTS = 'UPDATE_TOOL_DEFAULTS';
export const ADD_COLOR_PRESET = 'ADD_COLOR_PRESET';

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
    color: WebAlphaColor;
  };
}

export interface UpdateToolDefaultsAction {
  type: typeof UPDATE_TOOL_DEFAULTS;
  payload: {
    subtype: StylableSubtype;
    patch: Partial<ToolDefaultsBySubtype[StylableSubtype]>;
  };
}

export interface AddColorPresetAction extends Action {
  type: typeof ADD_COLOR_PRESET;
  payload: string;
}

export type AnnotationAction =
  | SetAnnotationsAction
  | SelectAnnotationAction
  | DeselectAnnotationAction
  | SetAnnotationModeAction
  | UpdateAnnotationColorAction
  | UpdateToolDefaultsAction
  | AddColorPresetAction;

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
  color: WebAlphaColor,
): UpdateAnnotationColorAction {
  return {
    type: UPDATE_ANNOTATION_COLOR,
    payload: { pageIndex, annotationId, color },
  };
}

export function updateToolDefaults(
  subtype: StylableSubtype,
  patch: Partial<ToolDefaultsBySubtype[StylableSubtype]>,
): UpdateToolDefaultsAction {
  return { type: UPDATE_TOOL_DEFAULTS, payload: { subtype, patch } };
}

export const addColorPreset = (color: string): AddColorPresetAction => ({
  type: ADD_COLOR_PRESET,
  payload: color,
});
