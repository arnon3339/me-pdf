import { Reducer } from "@embedpdf/core";
import { UIPluginState } from "./types";
import { UI_INIT_COMPONENTS, UIAction } from "./actions";

export const initialState: UIPluginState = {
  flyOut: {},
  actionTabs: {},
  panel: {},
  header: {},
  groupedItems: {},
  divider: {},
  toolButton: {},
  toggleButton: {},
  presetButton: {},
  custom: {}
};

export const uiReducer: Reducer<UIPluginState, UIAction> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case UI_INIT_COMPONENTS:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};