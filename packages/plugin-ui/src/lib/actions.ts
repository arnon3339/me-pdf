import { Action } from "@embedpdf/core";
import { UIPluginState } from "./types";

export const UI_INIT_COMPONENTS = "UI_INIT_COMPONENTS";
export const UI_INIT_FLYOUT = "UI_INIT_FLYOUT";
export const UI_TOGGLE_FLYOUT = "UI_TOGGLE_FLYOUT";

export interface UiInitComponentsAction extends Action {
  type: typeof UI_INIT_COMPONENTS;
  payload: UIPluginState;
}

export interface UiInitFlyoutAction extends Action {
  type: typeof UI_INIT_FLYOUT;
  payload: { id: string; triggerElement: HTMLElement };
}

export interface UiToggleFlyoutAction extends Action {
  type: typeof UI_TOGGLE_FLYOUT;
  payload: { id: string; open?: boolean };
}

export type UIAction =
  | UiInitComponentsAction
  | UiInitFlyoutAction
  | UiToggleFlyoutAction;

export const uiInitComponents = (state: UIPluginState): UiInitComponentsAction => ({
  type: UI_INIT_COMPONENTS,
  payload: state
});

export const uiInitFlyout = (id: string, triggerElement: HTMLElement): UiInitFlyoutAction => ({
  type: UI_INIT_FLYOUT,
  payload: { id, triggerElement }
});

export const uiToggleFlyout = (id: string, open?: boolean): UiToggleFlyoutAction => ({
  type: UI_TOGGLE_FLYOUT,
  payload: { id, open }
});

