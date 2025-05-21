import { Action } from '@embedpdf/core';
import { PdfPageGeometry } from '@embedpdf/models';
import { SelectionRangeX } from './types';

export const CACHE_PAGE_GEOMETRY = 'CACHE_PAGE_GEOMETRY';
export const SET_SELECTION       = 'SET_SELECTION';

export interface CachePageGeometryAction extends Action {
  type: typeof CACHE_PAGE_GEOMETRY;
  payload: { page: number; geo: PdfPageGeometry };
}
export interface SetSelectionAction extends Action {
  type: typeof SET_SELECTION;
  payload: SelectionRangeX | null;
}

export type SelectionAction =
  | CachePageGeometryAction
  | SetSelectionAction;

export const cachePageGeometry = (page:number,geo:PdfPageGeometry):
  CachePageGeometryAction => ({ type:CACHE_PAGE_GEOMETRY, payload:{page,geo} });

export const setSelection = (sel: SelectionRangeX|null):
  SetSelectionAction => ({ type: SET_SELECTION, payload: sel });