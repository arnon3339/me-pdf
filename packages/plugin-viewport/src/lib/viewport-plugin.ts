import { BasePlugin, PluginRegistry, EventControlOptions, EventControl, createEmitter } from "@embedpdf/core";
import { ViewportPluginConfig, ViewportState, ViewportCapability, ViewportMetrics, ViewportScrollMetrics, ViewportInputMetrics } from "./types";
import { ViewportAction, setViewportMetrics, setViewportScrollMetrics, setViewportGap } from "./actions";

export class ViewportPlugin extends BasePlugin<ViewportPluginConfig, ViewportCapability, ViewportState, ViewportAction> {
  private viewportChangeHandlers: Array<(metrics: ViewportMetrics) => void> = [];
  private readonly scrollReq$ =
    createEmitter<{ x:number; y:number; behavior?:ScrollBehavior }>();

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
      onViewportChange: (handler, options?: EventControlOptions) => {
        if (options) {
          const controlledHandler = new EventControl<ViewportMetrics>(handler, options).handle;
          this.viewportChangeHandlers.push(controlledHandler);
          return controlledHandler;
        }
        this.viewportChangeHandlers.push(handler);
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
      this.viewportChangeHandlers.forEach(handler => handler(newState.viewportMetrics));
    }
  }
  
  async initialize(_config: ViewportPluginConfig) {
    // No initialization needed
  }

  async destroy(): Promise<void> {
    super.destroy();
    // Clear out any handlers
    this.viewportChangeHandlers = [];
    this.scrollReq$.clear();
  }
}
