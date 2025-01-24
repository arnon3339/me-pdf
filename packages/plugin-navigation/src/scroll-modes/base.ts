import { IPDFCore } from "@cloudpdf/core";
import { NavigationState, ViewportState } from "../types";
import { ViewportTracker } from "../viewport/ViewportTracker";
import { NAVIGATION_EVENTS } from "../events";

export interface ScrollModeBaseOptions {
  core: IPDFCore;
  container: HTMLElement;
  state: NavigationState;
}

export abstract class ScrollModeBase {
  protected container: HTMLElement;
  protected state: NavigationState;
  protected core: IPDFCore;
  protected viewportTracker: ViewportTracker;

  constructor(options: ScrollModeBaseOptions) {
    this.container = options.container;
    this.state = options.state;
    this.core = options.core;
    this.viewportTracker = new ViewportTracker({
      container: options.container,
      state: options.state
    });
  }

  abstract initialize(): void;
  abstract destroy(): void;
  abstract goToPage(pageNumber: number): Promise<void>;
  abstract updateLayout(): void;

  getViewportState(emit: boolean = false): ViewportState {
    const viewportState = this.viewportTracker.getViewportState();

    if(emit) this.core.emit(NAVIGATION_EVENTS.VIEWPORT_STATE_CHANGED, viewportState);

    return viewportState;
  }
}