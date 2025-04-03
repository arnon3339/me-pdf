import { Reducer } from "@embedpdf/core";
import { UIPluginState } from "./types";
import { UI_INIT_COMPONENTS, UI_INIT_FLYOUT, UI_TOGGLE_FLYOUT, UIAction } from "./actions";

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
      return { 
        ...state, 
        ...action.payload 
      };
    case UI_INIT_FLYOUT:
      return { 
        ...state, 
        flyOut: { 
          ...state.flyOut, 
          [action.payload.id]: { 
            open: false, 
            triggerElement: action.payload.triggerElement 
          } 
        } 
      };
    case UI_TOGGLE_FLYOUT:
      return { 
        ...state, 
        flyOut: { 
          ...state.flyOut, 
          [action.payload.id]: { 
            ...state.flyOut[action.payload.id], 
            open: action.payload.open !== undefined ? action.payload.open : !state.flyOut[action.payload.id].open 
          } 
        } 
      };
    default:
      return state;
  }
};