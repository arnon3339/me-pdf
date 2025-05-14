import { BasePlugin, PluginRegistry, EventControlOptions, EventControl, createEmitter, createBehaviorEmitter } from "@embedpdf/core";
import { ViewportPluginConfig, ViewportState, ViewportCapability, ViewportMetrics, ViewportScrollMetrics, ViewportInputMetrics, ScrollToPayload } from "./types";
import { ViewportAction, setViewportMetrics, setViewportScrollMetrics, setViewportGap } from "./actions";

export class ViewportPlugin extends BasePlugin<ViewportPluginConfig, ViewportCapability, ViewportState, ViewportAction> {
  static readonly id = 'viewport' as const;
  private readonly viewportMetrics$ = createBehaviorEmitter<ViewportMetrics>();
  private readonly scrollMetrics$ = createBehaviorEmitter<ViewportScrollMetrics>();
  private readonly scrollReq$ = createEmitter<{ x:number; y:number; behavior?:ScrollBehavior }>();

  constructor(public readonly id: string, registry: PluginRegistry, config: ViewportPluginConfig) {
    super(id, registry);

    if(config.viewportGap) {
      this.dispatch(setViewportGap(config.viewportGap));
    }
  }

  protected buildCapability(): ViewportCapability {
    return {
      getViewportGap: () => this.getState().viewportGap,
      getMetrics: () => this.getState().viewportMetrics,
      onScrollChange: this.scrollMetrics$.on,
      onViewportChange: (handler, options?: EventControlOptions) => {
        if (options) {
          const controlledHandler = new EventControl<ViewportMetrics>(handler, options).handle;
          this.viewportMetrics$.on(controlledHandler);
          return controlledHandler;
        }
        this.viewportMetrics$.on(handler);
        return handler;
      },
      setViewportMetrics: (viewportMetrics: ViewportInputMetrics) => {
        this.dispatch(setViewportMetrics(viewportMetrics));
      },
      setViewportScrollMetrics: (scrollMetrics: ViewportScrollMetrics) => {
        this.dispatch(setViewportScrollMetrics(scrollMetrics));
      },
      scrollTo: (pos: ScrollToPayload) => this.scrollTo(pos),
      onScrollRequest : this.scrollReq$.on,
    };
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
