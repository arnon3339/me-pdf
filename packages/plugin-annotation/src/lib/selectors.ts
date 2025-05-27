import { AnnotationState } from './types';

export const getAnnotationsByPageIndex = (state: AnnotationState, pageIndex: number) => {
  return state.annotations[pageIndex] || [];
};

export const getAnnotations = (state: AnnotationState) => {
  return state.annotations;
};

export const getSelectedAnnotation = (state: AnnotationState) => {
  return state.selectedAnnotation;
};

export const isInAnnotationMode = (state: AnnotationState) => {
  return state.annotationMode !== null;
};

export const getSelectedAnnotationMode = (state: AnnotationState) => {
  return state.annotationMode;
};

export const isAnnotationSelected = (
  state: AnnotationState,
  pageIndex: number,
  annotationId: number,
) => {
  const selected = state.selectedAnnotation;
  return selected?.pageIndex === pageIndex && selected?.annotationId === annotationId;
};

export const getSelectedAnnotationColor = (state: AnnotationState) => {
  const selected = state.selectedAnnotation;
  if (!selected || !('color' in selected.annotation)) {
    return null;
  }
  return selected.annotation.color;
};
