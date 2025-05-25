import { Reducer } from '@embedpdf/core';
import { AnnotationAction, SET_ANNOTATIONS } from './actions';
import { AnnotationState } from './types';

export const initialState: AnnotationState = {
  annotations: {},
};

export const reducer: Reducer<AnnotationState, AnnotationAction> = (state, action) => {
  switch (action.type) {
    case SET_ANNOTATIONS:
      return { ...state, annotations: action.payload };
    default:
      return state;
  }
};
