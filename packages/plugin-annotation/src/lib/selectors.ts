import { AnnotationState } from './types';

export const getAnnotationsByPageIndex = (state: AnnotationState, pageIndex: number) => {
  return state.annotations[pageIndex];
};

export const getAnnotations = (state: AnnotationState) => {
  return state.annotations;
};
