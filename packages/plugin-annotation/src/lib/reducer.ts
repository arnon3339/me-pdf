import { Reducer } from '@embedpdf/core';
import { PdfAnnotationSubtype } from '@embedpdf/models';
import {
  AnnotationAction,
  SET_ANNOTATIONS,
  SELECT_ANNOTATION,
  DESELECT_ANNOTATION,
  SET_ANNOTATION_MODE,
  UPDATE_ANNOTATION_COLOR,
} from './actions';
import { AnnotationState } from './types';

export const initialState: AnnotationState = {
  annotations: {},
  selectedAnnotation: null,
  annotationMode: null,
};

export const reducer: Reducer<AnnotationState, AnnotationAction> = (state, action) => {
  switch (action.type) {
    case SET_ANNOTATIONS:
      return {
        ...state,
        annotations: action.payload,
        // Clear selection if the annotations have changed
        selectedAnnotation: null,
      };

    case SELECT_ANNOTATION:
      return {
        ...state,
        selectedAnnotation: action.payload,
      };

    case DESELECT_ANNOTATION:
      return {
        ...state,
        selectedAnnotation: null,
      };

    case SET_ANNOTATION_MODE:
      return {
        ...state,
        annotationMode: action.payload,
      };

    case UPDATE_ANNOTATION_COLOR: {
      const { pageIndex, annotationId, color } = action.payload;
      const pageAnnotations = state.annotations[pageIndex];

      if (!pageAnnotations) {
        return state;
      }

      const updatedAnnotations = pageAnnotations.map((annotation) => {
        if (annotation.id === annotationId) {
          // Only update color for annotations that support it (highlights, etc.)
          if (annotation.type === PdfAnnotationSubtype.HIGHLIGHT) {
            return {
              ...annotation,
              color,
            };
          }
        }
        return annotation;
      });

      const newAnnotations = {
        ...state.annotations,
        [pageIndex]: updatedAnnotations,
      };

      // Update selected annotation if it matches
      let newSelectedAnnotation = state.selectedAnnotation;
      if (
        newSelectedAnnotation &&
        newSelectedAnnotation.pageIndex === pageIndex &&
        newSelectedAnnotation.annotationId === annotationId
      ) {
        const updatedAnnotation = updatedAnnotations.find((a) => a.id === annotationId);
        if (updatedAnnotation) {
          newSelectedAnnotation = {
            ...newSelectedAnnotation,
            annotation: updatedAnnotation,
          };
        }
      }

      return {
        ...state,
        annotations: newAnnotations,
        selectedAnnotation: newSelectedAnnotation,
      };
    }

    default:
      return state;
  }
};
