import { BasePlugin, PluginRegistry, EventControlOptions, EventControl, createEmitter, createBehaviorEmitter } from "@embedpdf/core";
import { ViewportPluginConfig, ViewportState, ViewportCapability, ViewportMetrics, ViewportScrollMetrics, ViewportInputMetrics } from "./types";
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
      scrollTo: (pos) => this.scrollReq$.emit({
        behavior: 'auto',
        ...pos
      }),
      onScrollRequest : this.scrollReq$.on,
    };
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
