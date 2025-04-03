import { Reducer } from "@embedpdf/core";
import { UIPluginState } from "./types";
import { UI_INIT_COMPONENTS, UI_INIT_FLYOUT, UI_SET_HEADER_VISIBLE, UI_TOGGLE_FLYOUT, UI_TOGGLE_PANEL, UIAction } from "./actions";

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
    case UI_TOGGLE_PANEL:
      return {
        ...state,
        panel: {
          ...state.panel,
          [action.payload.id]: {
            ...state.panel[action.payload.id],
            open: action.payload.open !== undefined ? action.payload.open : !state.panel[action.payload.id].open
          }
        }
      };
    case UI_SET_HEADER_VISIBLE:
      return {
        ...state,
        header: {
          ...state.header,
          [action.payload.id]: {
            ...state.header[action.payload.id],
            visible: action.payload.visible,
            visibleChild: action.payload.visibleChild
          }
        }
      };
      
    default:
      return state;
  }
};