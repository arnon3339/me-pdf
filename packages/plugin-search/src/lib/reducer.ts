import { Reducer } from '@embedpdf/core';
import { SearchState } from './types';
import {
  START_SEARCH_SESSION,
  STOP_SEARCH_SESSION,
  SET_SEARCH_FLAGS,
  SET_SHOW_ALL_RESULTS,
  START_SEARCH,
  SET_SEARCH_RESULTS,
  SET_ACTIVE_RESULT_INDEX,
  SearchAction,
} from './actions';

export const initialState: SearchState = {
  flags: [],
  results: [],
  total: 0,
  activeResultIndex: -1,
  showAllResults: true,
  query: '',
  loading: false,
  active: false,
};

export const searchReducer: Reducer<SearchState, SearchAction> = (state = initialState, action) => {
  switch (action.type) {
    case START_SEARCH_SESSION:
      return { ...state, active: true };

    case STOP_SEARCH_SESSION:
      return {
        ...state,
        results: [],
        total: 0,
        activeResultIndex: -1,
        query: '',
        loading: false,
        active: false,
      };

    case SET_SEARCH_FLAGS:
      return { ...state, flags: action.payload };

    case SET_SHOW_ALL_RESULTS:
      return { ...state, showAllResults: action.payload };

    case START_SEARCH:
      return { ...state, loading: true, query: action.payload };

    case SET_SEARCH_RESULTS:
      return {
        ...state,
        results: action.payload.results,
        total: action.payload.total,
        activeResultIndex: action.payload.activeResultIndex,
        loading: false,
      };

    case SET_ACTIVE_RESULT_INDEX:
      return { ...state, activeResultIndex: action.payload };

    default:
      return state;
  }
};
