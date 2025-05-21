import { SelectionState } from './types';
import { SelectionAction,
         CACHE_PAGE_GEOMETRY,
         SET_SELECTION } from './actions';

export const initialState: SelectionState = {
  geometry: {},
  selection: null,
};

export const selectionReducer = (
  state = initialState,
  action: SelectionAction,
): SelectionState => {
  switch (action.type) {
    case CACHE_PAGE_GEOMETRY: {
      const { page, geo } = action.payload;
      return { ...state, geometry: { ...state.geometry, [page]: geo } };
    }
    case SET_SELECTION:
      return { ...state, selection: action.payload };
    default:
      return state;
  }
};
