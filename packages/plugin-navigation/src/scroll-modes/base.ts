import { NavigationState } from "../types";

export abstract class ScrollModeBase {
  protected container: HTMLElement;
  protected state: NavigationState;

  constructor(container: HTMLElement, state: NavigationState) {
    this.container = container;
    this.state = state;
  }

  abstract initialize(): void;
  abstract destroy(): void;
  abstract goToPage(pageNumber: number): Promise<void>;
  abstract updateLayout(zoomLevel: number): void;
}