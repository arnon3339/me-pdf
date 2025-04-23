import { Reducer, CoreState, SET_SCALE, SetScaleAction } from "@embedpdf/core";
import { ScrollState, ScrollStrategy, ScrollPluginConfig } from "./types";
import { ScrollAction, UPDATE_SCROLL_STATE, SET_DESIRED_SCROLL_POSITION } from "./actions";

export const initialState: (coreState: CoreState, config: ScrollPluginConfig) => ScrollState = (coreState, config) => ({
  virtualItems: [],
  totalContentSize: { width: 0, height: 0 },
  desiredScrollPosition: { x: 0, y: 0 },
  currentPage: 1,
  strategy: config.strategy ?? ScrollStrategy.Vertical,
  pageGap: config.pageGap ?? 10,
  startSpacing: 0,
  endSpacing: 0,
  visiblePages: [],
  pageVisibilityMetrics: [],
  renderedPageIndexes: [],
  scrollOffset: { x: 0, y: 0 },
  scale: coreState.scale
});

export const scrollReducer: Reducer<ScrollState, ScrollAction | SetScaleAction> = (state, action) => {
  switch (action.type) {
    case SET_SCALE: 
      return { ...state, scale: action.payload };
    case UPDATE_SCROLL_STATE:
      return { ...state, ...action.payload };
    case SET_DESIRED_SCROLL_POSITION:
      return { ...state, desiredScrollPosition: action.payload };
    default:
      return state;
  }
};