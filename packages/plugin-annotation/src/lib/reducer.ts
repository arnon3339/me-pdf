import { Reducer } from '@embedpdf/core';
import { PdfAnnotationSubtype } from '@embedpdf/models';
import {
  AnnotationAction,
  SET_ANNOTATIONS,
  SELECT_ANNOTATION,
  DESELECT_ANNOTATION,
  SET_ANNOTATION_MODE,
  UPDATE_ANNOTATION_COLOR,
  UPDATE_TOOL_DEFAULTS,
  ADD_COLOR_PRESET,
} from './actions';
import { AnnotationPluginConfig, AnnotationState, Color } from './types';

const DEFAULT_COLOR_PRESETS: Color[] = [
  { red: 228, green: 66, blue: 52 },
  { red: 255, green: 141, blue: 0 },
  { red: 255, green: 205, blue: 69 },
  { red: 92, green: 201, blue: 110 },
  { red: 37, green: 210, blue: 209 },
  { red: 89, green: 124, blue: 226 },
  { red: 197, green: 68, blue: 206 },
  { red: 125, green: 46, blue: 37 },
];

export const initialState = (config: AnnotationPluginConfig): AnnotationState => {
  return {
    annotations: {},
    selectedAnnotation: null,
    annotationMode: null,
    toolDefaults: {
      [PdfAnnotationSubtype.HIGHLIGHT]: {
        name: 'Highlight',
        color: { red: 255, green: 205, blue: 69, alpha: 255 },
      },
      [PdfAnnotationSubtype.UNDERLINE]: {
        name: 'Underline',
        color: { red: 228, green: 66, blue: 52, alpha: 255 },
      },
      [PdfAnnotationSubtype.STRIKEOUT]: {
        name: 'Strikeout',
        color: { red: 228, green: 66, blue: 52, alpha: 255 },
      },
      [PdfAnnotationSubtype.SQUIGGLY]: {
        name: 'Squiggly',
        color: { red: 228, green: 66, blue: 52, alpha: 255 },
      },
      ...config.toolDefaults,
    },
    colorPresets: config.colorPresets ?? DEFAULT_COLOR_PRESETS,
  };
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

    case UPDATE_TOOL_DEFAULTS: {
      const { subtype, patch } = action.payload;
      return {
        ...state,
        toolDefaults: {
          ...state.toolDefaults,
          [subtype]: { ...(state.toolDefaults[subtype] ?? {}), ...patch },
        },
      };
    }

    case ADD_COLOR_PRESET: {
      const exists = state.colorPresets?.some(
        (c) =>
          c.red === action.payload.red &&
          c.green === action.payload.green &&
          c.blue === action.payload.blue,
      );

      if (exists) {
        return state;
      }

      return {
        ...state,
        colorPresets: [...state.colorPresets, action.payload],
      };
    }

    default:
      return state;
  }
};
