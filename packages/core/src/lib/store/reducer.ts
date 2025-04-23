import { Reducer } from "./types";
import { CoreState } from "./initial-state";
import { CoreAction, LOAD_DOCUMENT, SET_DOCUMENT, SET_DOCUMENT_ERROR, SET_SCALE } from "./actions";

export const coreReducer: Reducer<CoreState, CoreAction> = (
  state,
  action
): CoreState => {
  switch (action.type) {
    case LOAD_DOCUMENT:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case SET_DOCUMENT:
      return {
        ...state,
        document: action.payload,
        loading: false,
        error: null
      };
    
    case SET_DOCUMENT_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case SET_SCALE:
      return {
        ...state,
        scale: action.payload
      };

    default:
      return state;
  }
};