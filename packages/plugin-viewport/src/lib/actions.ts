import { Action } from "@embedpdf/core";
import { ViewportInputMetrics, ViewportScrollMetrics } from "./types";

export const SET_VIEWPORT_METRICS = "SET_VIEWPORT_METRICS";
export const SET_VIEWPORT_SCROLL_METRICS = "SET_VIEWPORT_SCROLL_METRICS";
export const SET_VIEWPORT_GAP = "SET_VIEWPORT_GAP";

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

export type ViewportAction = SetViewportMetricsAction | SetViewportScrollMetricsAction | SetViewportGapAction;

export function setViewportGap(
  viewportGap: number
): SetViewportGapAction {
  return {
    type: SET_VIEWPORT_GAP,
    payload: viewportGap
  };
}

export function setViewportMetrics(
  viewportMetrics: ViewportInputMetrics
): SetViewportMetricsAction {
  return {
    type: SET_VIEWPORT_METRICS,
    payload: viewportMetrics
  };
}

export function setViewportScrollMetrics(
  scrollMetrics: ViewportScrollMetrics
): SetViewportScrollMetricsAction {
  return {
    type: SET_VIEWPORT_SCROLL_METRICS,
    payload: scrollMetrics
  };
}