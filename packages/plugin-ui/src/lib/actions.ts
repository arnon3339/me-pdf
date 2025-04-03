import { Action } from "@embedpdf/core";
import { UIPluginState } from "./types";

export const UI_INIT_COMPONENTS = "UI_INIT_COMPONENTS";

export interface UiInitComponentsAction extends Action {
  type: typeof UI_INIT_COMPONENTS;
  payload: UIPluginState;
}

export type UIAction =
  | UiInitComponentsAction;

export const uiInitComponents = (state: UIPluginState): UiInitComponentsAction => ({
  type: UI_INIT_COMPONENTS,
  payload: state
});


