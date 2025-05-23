import { Action } from '@embedpdf/core';
import { ScrollState } from './types';

export const UPDATE_SCROLL_STATE = 'UPDATE_SCROLL_STATE';
export const SET_DESIRED_SCROLL_POSITION = 'SET_DESIRED_SCROLL_POSITION';

export interface UpdateScrollStateAction extends Action {
  type: typeof UPDATE_SCROLL_STATE;
  payload: Partial<ScrollState>;
}

export interface SetDesiredScrollPositionAction extends Action {
  type: typeof SET_DESIRED_SCROLL_POSITION;
  payload: { x: number; y: number };
}

export type ScrollAction = UpdateScrollStateAction | SetDesiredScrollPositionAction;

export function updateScrollState(payload: Partial<ScrollState>): UpdateScrollStateAction {
  return { type: UPDATE_SCROLL_STATE, payload };
}

export function setDesiredScrollPosition(payload: {
  x: number;
  y: number;
}): SetDesiredScrollPositionAction {
  return { type: SET_DESIRED_SCROLL_POSITION, payload };
}
