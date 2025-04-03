import { Action } from "@embedpdf/core";
import { UIPluginState } from "./types";

export const UI_INIT_COMPONENTS = "UI_INIT_COMPONENTS";
export const UI_INIT_FLYOUT = "UI_INIT_FLYOUT";
export const UI_TOGGLE_FLYOUT = "UI_TOGGLE_FLYOUT";
export const UI_SET_HEADER_VISIBLE = "UI_SET_HEADER_VISIBLE";

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

export interface UiSetHeaderVisibleAction extends Action {
  type: typeof UI_SET_HEADER_VISIBLE;
  payload: { id: string; visible: boolean; visibleChild?: string | null };
}

export type UIAction =
  | UiInitComponentsAction
  | UiInitFlyoutAction
  | UiToggleFlyoutAction
  | UiSetHeaderVisibleAction;

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

export const uiSetHeaderVisible = (id: string, visible: boolean, visibleChild?: string | null): UiSetHeaderVisibleAction => ({
  type: UI_SET_HEADER_VISIBLE,
  payload: { id, visible, visibleChild }
});
