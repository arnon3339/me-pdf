import { Reducer } from '@embedpdf/core';
import { ACTIVATE_MODE, InteractionManagerAction, SET_CURSOR } from './actions';
import { InteractionManagerState } from './types';

export const initialState: InteractionManagerState = {
  activeMode: 'default',
  cursor: 'auto',
};

export const reducer: Reducer<InteractionManagerState, InteractionManagerAction> = (
  state,
  action,
) => {
  switch (action.type) {
    case ACTIVATE_MODE:
      return {
        ...state,
        activeMode: action.payload.mode,
      };
    case SET_CURSOR:
      return {
        ...state,
        cursor: action.payload.cursor,
      };
    default:
      return state;
  }
};
