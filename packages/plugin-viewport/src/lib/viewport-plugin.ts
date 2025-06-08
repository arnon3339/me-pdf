import { BasePlugin, PluginRegistry, createEmitter, createBehaviorEmitter } from '@embedpdf/core';

import {
  ViewportAction,
  setViewportMetrics,
  setViewportScrollMetrics,
  setViewportGap,
  setScrollActivity,
} from './actions';
import {
  ViewportPluginConfig,
  ViewportState,
  ViewportCapability,
  ViewportMetrics,
  ViewportScrollMetrics,
  ViewportInputMetrics,
  ScrollToPayload,
  ViewportRect,
} from './types';

export class ViewportPlugin extends BasePlugin<
  ViewportPluginConfig,
  ViewportCapability,
  ViewportState,
  ViewportAction
> {
  static readonly id = 'viewport' as const;

  private readonly viewportMetrics$ = createBehaviorEmitter<ViewportMetrics>();
  private readonly scrollMetrics$ = createBehaviorEmitter<ViewportScrollMetrics>();
  private readonly scrollReq$ = createEmitter<{
    x: number;
    y: number;
    behavior?: ScrollBehavior;
  }>();
  private readonly scrollActivity$ = createBehaviorEmitter<boolean>();

  /* ------------------------------------------------------------------ */
  /* “live rect” infrastructure                                          */
  /* ------------------------------------------------------------------ */
  private rectProvider: (() => ViewportRect) | null = null;

  private scrollEndTimer?: number;
  private readonly scrollEndDelay: number;

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    config: ViewportPluginConfig,
  ) {
    super(id, registry);

    if (config.viewportGap) {
      this.dispatch(setViewportGap(config.viewportGap));
    }

    this.scrollEndDelay = config.scrollEndDelay || 300;
  }

  protected buildCapability(): ViewportCapability {
    return {
      getViewportGap: () => this.state.viewportGap,
      getMetrics: () => this.state.viewportMetrics,
      onScrollChange: this.scrollMetrics$.on,
      onViewportChange: this.viewportMetrics$.on,
      registerRectProvider: (fn) => {
        this.rectProvider = fn;
      },
      getRect: () =>
        this.rectProvider?.() ?? {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
        },
      setViewportMetrics: (viewportMetrics: ViewportInputMetrics) => {
        this.dispatch(setViewportMetrics(viewportMetrics));
      },
      setViewportScrollMetrics: this.setViewportScrollMetrics.bind(this),
      scrollTo: (pos: ScrollToPayload) => this.scrollTo(pos),
      onScrollRequest: this.scrollReq$.on,
      isScrolling: () => this.state.isScrolling,
      onScrollActivity: this.scrollActivity$.on,
    };
  }

  private bumpScrollActivity() {
    if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
    this.scrollEndTimer = window.setTimeout(() => {
      this.dispatch(setScrollActivity(false));
      this.scrollEndTimer = undefined;
    }, this.scrollEndDelay);
  }

  private setViewportScrollMetrics(scrollMetrics: ViewportScrollMetrics) {
    if (
      scrollMetrics.scrollTop !== this.state.viewportMetrics.scrollTop ||
      scrollMetrics.scrollLeft !== this.state.viewportMetrics.scrollLeft
    ) {
      this.dispatch(setViewportScrollMetrics(scrollMetrics));
      this.bumpScrollActivity();
    }
  }

  private scrollTo(pos: ScrollToPayload) {
    const { x, y, center, behavior = 'auto' } = pos;

    if (center) {
      const metrics = this.state.viewportMetrics;
      // Calculate the centered position by adding half the viewport dimensions
      const centeredX = x - metrics.clientWidth / 2;
      const centeredY = y - metrics.clientHeight / 2;

      this.scrollReq$.emit({
        x: centeredX,
        y: centeredY,
        behavior,
      });
    } else {
      this.scrollReq$.emit({
        x,
        y,
        behavior,
      });
    }
  }

  // Subscribe to store changes to notify onViewportChange
  override onStoreUpdated(prevState: ViewportState, newState: ViewportState): void {
    if (prevState !== newState) {
      this.viewportMetrics$.emit(newState.viewportMetrics);
      this.scrollMetrics$.emit({
        scrollTop: newState.viewportMetrics.scrollTop,
        scrollLeft: newState.viewportMetrics.scrollLeft,
      });
      if (prevState.isScrolling !== newState.isScrolling) {
        this.scrollActivity$.emit(newState.isScrolling);
      }
    }
  }

  async initialize(_config: ViewportPluginConfig) {
    // No initialization needed
  }

  async destroy(): Promise<void> {
    super.destroy();
    // Clear out any handlers
    this.viewportMetrics$.clear();
    this.scrollMetrics$.clear();
    this.scrollReq$.clear();
    this.scrollActivity$.clear();
    this.rectProvider = null;
    if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
  }
}
