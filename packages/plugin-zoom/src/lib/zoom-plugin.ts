import { 
  PluginRegistry,
  BasePlugin
} from "@embedpdf/core";
import { ViewportCapability, ViewportPlugin } from "@embedpdf/plugin-viewport";
import { PageManagerCapability, PageManagerPlugin } from "@embedpdf/plugin-page-manager";
import { ZoomCapability, ZoomChangeEvent, ZoomLevel, ZoomPluginConfig, ZoomState } from "./types";
import { ZoomController } from "./zoom/zoom-controller";

export class ZoomPlugin extends BasePlugin<ZoomPluginConfig, ZoomState> {
  private zoomHandlers: ((zoomEvent: ZoomChangeEvent) => void)[] = [];
  private viewport: ViewportCapability;
  private pageManager: PageManagerCapability;
  private zoomController!: ZoomController;

  constructor(  
    public readonly id: string,
    registry: PluginRegistry,
  ) {
    super(id, registry, {
      zoomLevel: 'automatic',
      currentZoomLevel: 1
    });

    this.viewport = this.registry.getPlugin<ViewportPlugin>('viewport').provides();
    this.pageManager = this.registry.getPlugin<PageManagerPlugin>('page-manager').provides();
  
    this.pageManager.onPagesChange(this.refreshZoomIfAutomatic.bind(this));
    this.viewport.onResize(this.refreshZoomIfAutomatic.bind(this), { mode: 'debounce', wait: 200 });
  }

  provides(): ZoomCapability {
    return {
      onZoom: (handler) => this.zoomHandlers.push(handler),
      updateZoomLevel: (zoomLevel) => this.updateZoomLevel(zoomLevel),
      getState: () => this.getState(),
      onStateChange: (handler) => this.onStateChange(handler)
    };
  }

  async initialize(config: ZoomPluginConfig): Promise<void> {
    // Update state with config values
    this.updateState({
      zoomLevel: config.defaultZoomLevel,
      currentZoomLevel: 1
    });

    // Initialize zoom controller
    this.zoomController = new ZoomController({
      viewport: this.viewport,
      pageManager: this.pageManager,
      state: this.state,
      options: {
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        zoomStep: config.zoomStep
      }
    });

    // Initial zoom level setup
    await this.updateZoomLevel(config.defaultZoomLevel);
  }

  private refreshZoomIfAutomatic(): void {
    if(
      this.state.zoomLevel === 'automatic' || 
      this.state.zoomLevel === 'fit-page' || 
      this.state.zoomLevel === 'fit-width'
    ) {
      this.updateZoomLevel(this.state.zoomLevel);
    }
  }

  async updateZoomLevel(zoomLevel: ZoomLevel): Promise<void> {
    this.updateState({ zoomLevel });

    const zoomEvent = this.zoomController.zoomTo(zoomLevel);

    if(zoomEvent.newZoom !== zoomEvent.oldZoom) {
      this.pageManager.updateScale(zoomEvent.newZoom);
    }
  }

  async destroy(): Promise<void> {
    if (this.zoomController) {
      this.zoomController.destroy();
    }
    this.zoomHandlers = [];
    
    // Call parent destroy to clean up state handlers
    await super.destroy();
  }
}