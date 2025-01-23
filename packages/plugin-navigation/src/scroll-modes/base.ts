import { IPDFCore } from "@cloudpdf/core";
import { NavigationState } from "../types";
import { ViewportTracker } from "../viewport/ViewportTracker";

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
    this.viewportTracker = new ViewportTracker(options.container, options.state);
  }

  abstract initialize(): void;
  abstract destroy(): void;
  abstract goToPage(pageNumber: number): Promise<void>;
  abstract updateLayout(): void;
}