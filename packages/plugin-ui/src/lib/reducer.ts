import { Reducer } from "@embedpdf/core";
import { UIPluginState } from "./types";
import { UI_HIDE_COMMAND_MENU, UI_INIT_COMPONENTS, UI_SET_HEADER_VISIBLE, UI_SHOW_COMMAND_MENU, UI_TOGGLE_PANEL, UIPluginAction } from "./actions";

export const initialState: UIPluginState = {
  actionTabs: {},
  panel: {},
  header: {},
  groupedItems: {},
  divider: {},
  toolButton: {},
  presetButton: {},
  custom: {},
  floating: {},
  commandMenu: {}
};

export const uiReducer: Reducer<UIPluginState, UIPluginAction> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case UI_INIT_COMPONENTS:
      return { 
        ...state, 
        ...action.payload 
      };
    case UI_TOGGLE_PANEL: {
      const prevPanel = state.panel[action.payload.id] || {};
      const { open: nextOpen, visibleChild: nextVisibleChild } = action.payload;
      const prevVisibleChild = prevPanel.visibleChild;

      let open = prevPanel.open;
      let visibleChild = prevPanel.visibleChild;

      if (nextVisibleChild === prevVisibleChild) {
        // Toggle open if visibleChild is the same
        open = nextOpen !== undefined ? nextOpen : !prevPanel.open;
      } else {
        // Only change visibleChild, keep open as is
        visibleChild = nextVisibleChild;
        open = true;
      }

      return {
        ...state,
        panel: {
          ...state.panel,
          [action.payload.id]: {
            ...prevPanel,
            open,
            visibleChild,
          }
        }
      };
    }
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
    case UI_SHOW_COMMAND_MENU:
      return {
        ...state,
        commandMenu: {
          ...state.commandMenu,
          [action.payload.id]: {
            activeCommand: action.payload.commandId,
            triggerElement: action.payload.triggerElement,
            position: action.payload.position,
            open: true,
            flatten: action.payload.flatten
          }
        }
      };
    case UI_HIDE_COMMAND_MENU:
      return {
        ...state,
        commandMenu: {
          ...state.commandMenu,
          [action.payload.id]: {
            ...state.commandMenu[action.payload.id],
            open: false,
            activeCommand: null,
            triggerElement: undefined,
            position: undefined,
            flatten: false
          }
        }
      };
      
    default:
      return state;
  }
};