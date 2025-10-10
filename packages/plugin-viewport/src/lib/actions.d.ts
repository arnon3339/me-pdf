import { Action } from '@embedpdf/core';
import { ViewportInputMetrics, ViewportScrollMetrics } from './types';
export declare const SET_VIEWPORT_METRICS = "SET_VIEWPORT_METRICS";
export declare const SET_VIEWPORT_SCROLL_METRICS = "SET_VIEWPORT_SCROLL_METRICS";
export declare const SET_VIEWPORT_GAP = "SET_VIEWPORT_GAP";
export declare const SET_SCROLL_ACTIVITY = "SET_SCROLL_ACTIVITY";
export declare const SET_SMOOTH_SCROLL_ACTIVITY = "SET_SMOOTH_SCROLL_ACTIVITY";
export interface SetViewportMetricsAction extends Action {
    type: typeof SET_VIEWPORT_METRICS;
    payload: ViewportInputMetrics;
}
export interface SetViewportScrollMetricsAction extends Action {
    type: typeof SET_VIEWPORT_SCROLL_METRICS;
    payload: ViewportScrollMetrics;
}
export interface SetViewportGapAction extends Action {
    type: typeof SET_VIEWPORT_GAP;
    payload: number;
}
export interface SetScrollActivityAction extends Action {
    type: typeof SET_SCROLL_ACTIVITY;
    payload: boolean;
}
export interface SetSmoothScrollActivityAction extends Action {
    type: typeof SET_SMOOTH_SCROLL_ACTIVITY;
    payload: boolean;
}
export type ViewportAction = SetViewportMetricsAction | SetViewportScrollMetricsAction | SetViewportGapAction | SetScrollActivityAction | SetSmoothScrollActivityAction;
export declare function setViewportGap(viewportGap: number): SetViewportGapAction;
export declare function setViewportMetrics(viewportMetrics: ViewportInputMetrics): SetViewportMetricsAction;
export declare function setViewportScrollMetrics(scrollMetrics: ViewportScrollMetrics): SetViewportScrollMetricsAction;
export declare function setScrollActivity(isScrolling: boolean): SetScrollActivityAction;
export declare function setSmoothScrollActivity(isSmoothScrolling: boolean): SetSmoothScrollActivityAction;
