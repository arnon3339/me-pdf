import { Reducer } from '@embedpdf/core';
import { ViewportAction } from './actions';
import { ViewportState } from './types';
export declare const initialState: ViewportState;
export declare const viewportReducer: Reducer<ViewportState, ViewportAction>;
