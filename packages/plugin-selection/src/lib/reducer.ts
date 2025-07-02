import { SelectionState } from './types';
import {
  SelectionAction,
  CACHE_PAGE_GEOMETRY,
  SET_SELECTION,
  START_SELECTION,
  END_SELECTION,
  SET_RECTS,
  SET_ALL_RECTS,
  CLEAR_SELECTION,
  RESET,
} from './actions';

export const initialState: SelectionState = {
  geometry: {},
  rects: {},
  selection: null,
  active: false,
  selecting: false,
};

export const selectionReducer = (state = initialState, action: SelectionAction): SelectionState => {
  switch (action.type) {
    case CACHE_PAGE_GEOMETRY: {
      const { page, geo } = action.payload;
      return { ...state, geometry: { ...state.geometry, [page]: geo } };
    }
    case SET_SELECTION:
      return { ...state, selection: action.payload, active: true };
    case START_SELECTION:
      return { ...state, selecting: true, selection: null, rects: {} };
    case END_SELECTION:
      return { ...state, selecting: false };
    case CLEAR_SELECTION:
      return { ...state, selecting: false, selection: null, rects: {}, active: false };
    case SET_RECTS:
      return { ...state, rects: { ...state.rects, [action.payload.page]: action.payload.rects } };
    case SET_ALL_RECTS:
      return { ...state, rects: action.payload };
    case RESET:
      return initialState;
    default:
      return state;
  }
};
