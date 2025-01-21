import { IPDFCore } from "@cloudpdf/core";
import { NavigationState } from "../types";

export interface ScrollModeBaseOptions {
  core: IPDFCore;
  container: HTMLElement;
  state: NavigationState;
}

export abstract class ScrollModeBase {
  protected container: HTMLElement;
  protected state: NavigationState;
  protected core: IPDFCore;

  constructor(options: ScrollModeBaseOptions) {
    this.container = options.container;
    this.state = options.state;
    this.core = options.core;
  }

  abstract initialize(): void;
  abstract destroy(): void;
  abstract goToPage(pageNumber: number): Promise<void>;
  abstract updateLayout(): void;
}