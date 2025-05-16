import { Reducer, CoreState } from '@embedpdf/core';
import {
  SelectionAction,
  SET_PAGE_GLYPHS,
  SET_ACTIVE_SELECTION,
} from './actions';
import { SelectionPluginConfig, SelectionState } from './types';

export const initialState = {
  glyphCache: {},        // { [pageIdx]: PdfGlyphObject[] }
  selection: null,       // { pageIndex, range } or null
};

export const selectionReducer: Reducer<SelectionState, SelectionAction> = (
  state,
  action,
) => {
  switch (action.type) {
    case SET_PAGE_GLYPHS: {
      const { pageIndex, glyphs } = action.payload;
      return {
        ...state,
        glyphCache: { ...state.glyphCache, [pageIndex]: glyphs },
      };
    }
    case SET_ACTIVE_SELECTION:
      return { ...state, selection: action.payload };
    default:
      return state;
  }
};