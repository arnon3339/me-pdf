import { BasePlugin, PluginRegistry, createEmitter, createBehaviorEmitter } from "@embedpdf/core";
import { ViewportPluginConfig, ViewportState, ViewportCapability, ViewportMetrics, ViewportScrollMetrics, ViewportInputMetrics, ScrollToPayload } from "./types";
import { ViewportAction, setViewportMetrics, setViewportScrollMetrics, setViewportGap, setScrollActivity } from "./actions";

export class ViewportPlugin extends BasePlugin<ViewportPluginConfig, ViewportCapability, ViewportState, ViewportAction> {
  static readonly id = 'viewport' as const;

  private readonly viewportMetrics$ = createBehaviorEmitter<ViewportMetrics>();
  private readonly scrollMetrics$ = createBehaviorEmitter<ViewportScrollMetrics>();
  private readonly scrollReq$ = createEmitter<{ x:number; y:number; behavior?:ScrollBehavior }>();
  private readonly scrollActivity$ = createBehaviorEmitter<boolean>();

  private scrollEndTimer?: number;
  private readonly scrollEndDelay: number;

  constructor(public readonly id: string, registry: PluginRegistry, config: ViewportPluginConfig) {
    super(id, registry);

    if(config.viewportGap) {
      this.dispatch(setViewportGap(config.viewportGap));
    }

    this.scrollEndDelay = config.scrollEndDelay || 150;
  }

  protected buildCapability(): ViewportCapability {
    return {
      getViewportGap: () => this.getState().viewportGap,
      getMetrics: () => this.getState().viewportMetrics,
      onScrollChange: this.scrollMetrics$.on,
      onViewportChange: this.viewportMetrics$.on,
      setViewportMetrics: (viewportMetrics: ViewportInputMetrics) => {
        this.dispatch(setViewportMetrics(viewportMetrics));
      },
      setViewportScrollMetrics: this.setViewportScrollMetrics.bind(this),
      scrollTo: (pos: ScrollToPayload) => this.scrollTo(pos),
      onScrollRequest : this.scrollReq$.on,
      isScrolling: () => this.getState().isScrolling,
      onScrollActivity: this.scrollActivity$.on
    };
  }

  private bumpScrollActivity() {
    if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
    this.scrollEndTimer = window.setTimeout(() => {
      this.dispatch(setScrollActivity(false));
      this.scrollEndTimer = undefined;
      this.scrollActivity$.emit(false);
    }, this.scrollEndDelay);
  }

  private setViewportScrollMetrics(scrollMetrics: ViewportScrollMetrics) {
    if(
      scrollMetrics.scrollTop !== this.getState().viewportMetrics.scrollTop || 
      scrollMetrics.scrollLeft !== this.getState().viewportMetrics.scrollLeft
    ) {
      this.dispatch(setViewportScrollMetrics(scrollMetrics));
      this.scrollActivity$.emit(true);
      this.bumpScrollActivity();
    }
  }

  private scrollTo(pos: ScrollToPayload) {
    const { x, y, center, behavior = 'auto' } = pos;
    
    if (center) {
      const metrics = this.getState().viewportMetrics;
      // Calculate the centered position by adding half the viewport dimensions
      const centeredX = x - (metrics.clientWidth / 2);
      const centeredY = y - (metrics.clientHeight / 2);
      
      this.scrollReq$.emit({
        x: centeredX,
        y: centeredY,
        behavior
      });
    } else {
      this.scrollReq$.emit({
        x,
        y,
        behavior
      });
    }
  }

  // Subscribe to store changes to notify onViewportChange
  override onStoreUpdated(prevState: ViewportState, newState: ViewportState): void {
    if (prevState !== newState) {
      this.viewportMetrics$.emit(newState.viewportMetrics);
      this.scrollMetrics$.emit({
        scrollTop: newState.viewportMetrics.scrollTop,
        scrollLeft: newState.viewportMetrics.scrollLeft
      });
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
  }
}
