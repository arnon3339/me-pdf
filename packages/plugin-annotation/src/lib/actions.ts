import { Action } from '@embedpdf/core';
import { PdfAnnotationObject } from '@embedpdf/models';
import { StylableSubtype, ToolDefaultsBySubtype } from './types';

/* ─────────── action constants ─────────── */
export const SET_ANNOTATIONS = 'ANNOTATION/SET_ANNOTATIONS';
export const SELECT_ANNOTATION = 'ANNOTATION/SELECT_ANNOTATION';
export const DESELECT_ANNOTATION = 'ANNOTATION/DESELECT_ANNOTATION';
export const SET_ANNOTATION_MODE = 'ANNOTATION/SET_ANNOTATION_MODE';
export const UPDATE_TOOL_DEFAULTS = 'ANNOTATION/UPDATE_TOOL_DEFAULTS';
export const ADD_COLOR_PRESET = 'ANNOTATION/ADD_COLOR_PRESET';
export const CREATE_ANNOTATION = 'ANNOTATION/CREATE_ANNOTATION';
export const PATCH_ANNOTATION = 'ANNOTATION/PATCH_ANNOTATION';
export const DELETE_ANNOTATION = 'ANNOTATION/DELETE_ANNOTATION';
export const UNDO = 'ANNOTATION/UNDO';
export const REDO = 'ANNOTATION/REDO';
export const COMMIT_PENDING_CHANGES = 'ANNOTATION/COMMIT';

/* ─────────── action interfaces ─────────── */
export interface SetAnnotationsAction extends Action {
  type: typeof SET_ANNOTATIONS;
  payload: Record<number, PdfAnnotationObject[]>;
}
export interface SelectAnnotationAction extends Action {
  type: typeof SELECT_ANNOTATION;
  payload: { pageIndex: number; annotationId: number };
}
export interface DeselectAnnotationAction extends Action {
  type: typeof DESELECT_ANNOTATION;
}
export interface SetAnnotationModeAction extends Action {
  type: typeof SET_ANNOTATION_MODE;
  payload: StylableSubtype | null;
}

export interface UpdateToolDefaultsAction extends Action {
  type: typeof UPDATE_TOOL_DEFAULTS;
  payload: { subtype: StylableSubtype; patch: Partial<ToolDefaultsBySubtype[StylableSubtype]> };
}

export interface AddColorPresetAction extends Action {
  type: typeof ADD_COLOR_PRESET;
  payload: string;
}
export interface CreateAnnotationAction extends Action {
  type: typeof CREATE_ANNOTATION;
  payload: { pageIndex: number; annotation: PdfAnnotationObject };
}
export interface PatchAnnotationAction extends Action {
  type: typeof PATCH_ANNOTATION;
  payload: { pageIndex: number; annotationId: number; patch: Partial<PdfAnnotationObject> };
}
export interface DeleteAnnotationAction extends Action {
  type: typeof DELETE_ANNOTATION;
  payload: { pageIndex: number; annotationId: number };
}
export interface UndoAction extends Action {
  type: typeof UNDO;
}
export interface RedoAction extends Action {
  type: typeof REDO;
}
export interface CommitAction extends Action {
  type: typeof COMMIT_PENDING_CHANGES;
}

export type AnnotationAction =
  | SetAnnotationsAction
  | SelectAnnotationAction
  | DeselectAnnotationAction
  | SetAnnotationModeAction
  | UpdateToolDefaultsAction
  | AddColorPresetAction
  | CreateAnnotationAction
  | PatchAnnotationAction
  | DeleteAnnotationAction
  | UndoAction
  | RedoAction
  | CommitAction;

/* ─────────── action creators ─────────── */
export const setAnnotations = (p: Record<number, PdfAnnotationObject[]>): SetAnnotationsAction => ({
  type: SET_ANNOTATIONS,
  payload: p,
});

export const selectAnnotation = (
  pageIndex: number,
  annotationId: number,
): SelectAnnotationAction => ({ type: SELECT_ANNOTATION, payload: { pageIndex, annotationId } });

export const deselectAnnotation = (): DeselectAnnotationAction => ({ type: DESELECT_ANNOTATION });

export const setAnnotationMode = (m: StylableSubtype | null): SetAnnotationModeAction => ({
  type: SET_ANNOTATION_MODE,
  payload: m,
});

export const updateToolDefaults = <S extends StylableSubtype>(
  subtype: S,
  patch: Partial<ToolDefaultsBySubtype[S]>,
): UpdateToolDefaultsAction => ({ type: UPDATE_TOOL_DEFAULTS, payload: { subtype, patch } });

export const addColorPreset = (c: string): AddColorPresetAction => ({
  type: ADD_COLOR_PRESET,
  payload: c,
});

export const createAnnotation = (
  pageIndex: number,
  annotation: PdfAnnotationObject,
): CreateAnnotationAction => ({ type: CREATE_ANNOTATION, payload: { pageIndex, annotation } });

export const patchAnnotation = (
  pageIndex: number,
  annotationId: number,
  patch: Partial<PdfAnnotationObject>,
): PatchAnnotationAction => ({
  type: PATCH_ANNOTATION,
  payload: { pageIndex, annotationId, patch },
});

export const deleteAnnotation = (
  pageIndex: number,
  annotationId: number,
): DeleteAnnotationAction => ({ type: DELETE_ANNOTATION, payload: { pageIndex, annotationId } });

export const undo = (): UndoAction => ({ type: UNDO });
export const redo = (): RedoAction => ({ type: REDO });
export const commitPendingChanges = (): CommitAction => ({ type: COMMIT_PENDING_CHANGES });
