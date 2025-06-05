import { Action } from '@embedpdf/core';
import { InteractionScope } from './types';

export const ACTIVATE_MODE = 'INTERACTION/ACTIVATE_MODE';

export interface ActivateModeAction extends Action {
  type: typeof ACTIVATE_MODE;
  payload: { mode: string };
}

export const activateMode = (mode: string): ActivateModeAction => ({
  type: ACTIVATE_MODE,
  payload: { mode },
});

export const SET_CURSOR = 'INTERACTION/SET_CURSOR';
export interface SetCursorAction extends Action {
  type: typeof SET_CURSOR;
  payload: { cursor: string };
}
export const setCursor = (cursor: string): SetCursorAction => ({
  type: SET_CURSOR,
  payload: { cursor },
});

export type InteractionManagerAction = ActivateModeAction | SetCursorAction;
