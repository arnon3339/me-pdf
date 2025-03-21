import { 
  PluginRegistry,
  BasePlugin
} from "@embedpdf/core";
import { ViewportCapability, ViewportPlugin } from "@embedpdf/plugin-viewport";
import { PageManagerCapability, PageManagerPlugin } from "@embedpdf/plugin-page-manager";
import { ZoomCapability, ZoomChangeEvent, ZoomLevel, ZoomMode, ZoomPluginConfig, ZoomState } from "./types";
import { ZoomController } from "./zoom/zoom-controller";
import { PinchController } from "./zoom/pinch-controller";

export class ZoomPlugin extends BasePlugin<ZoomPluginConfig, ZoomState> {
  private zoomHandlers: ((zoomEvent: ZoomChangeEvent) => void)[] = [];
  private viewport: ViewportCapability;
  private pageManager: PageManagerCapability;
  private zoomController!: ZoomController;
  private pinchController!: PinchController;

  constructor(  
    public readonly id: string,
    registry: PluginRegistry,
  ) {
    super(id, registry, {
      zoomLevel: ZoomMode.Automatic,
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
      onStateChange: (handler) => this.onStateChange(handler),
      zoomIn: () => this.zoomIn(),
      zoomOut: () => this.zoomOut()
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

    // Initialize pinch controller
    this.pinchController = new PinchController({
      innerDiv: this.viewport.getInnerDiv(),
      container: this.viewport.getContainer(),
      state: this.state,
      onPinchEnd: (zoom?: number, center?: { x: number; y: number }) => {
        if(!zoom) return;
        const zoomEvent = this.zoomController.zoomTo(zoom, center);

        this.handleZoomChange(zoomEvent.newZoom, zoomEvent, true);
      }
    });

    // Initial zoom level setup
    await this.updateZoomLevel(config.defaultZoomLevel);
  }

  private refreshZoomIfAutomatic(): void {
    if(
      this.state.zoomLevel === ZoomMode.Automatic || 
      this.state.zoomLevel === ZoomMode.FitPage || 
      this.state.zoomLevel === ZoomMode.FitWidth
    ) {
      this.updateZoomLevel(this.state.zoomLevel);
    }
  }

  private handleZoomChange(zoomLevel: ZoomLevel, zoomEvent: ZoomChangeEvent, force?: boolean): void {
    this.updateState({ 
      zoomLevel: zoomLevel, 
      currentZoomLevel: zoomEvent.newZoom 
    });

    // Update page scale if zoom level changed
    if (zoomEvent.newZoom !== zoomEvent.oldZoom || force) {
      this.pageManager.updateScale(zoomEvent.newZoom);
    }

    // Notify handlers about zoom change
    this.zoomHandlers.forEach(handler => handler(zoomEvent));
  }

  updateZoomLevel(zoomLevel: ZoomLevel): ZoomChangeEvent {
    const zoomEvent = this.zoomController.zoomTo(zoomLevel);
    this.handleZoomChange(zoomLevel, zoomEvent);
    
    return zoomEvent;
  }

  zoomIn(): ZoomChangeEvent {
    const zoomEvent = this.zoomController.zoomIn();
    this.handleZoomChange(zoomEvent.newZoom, zoomEvent);

    return zoomEvent;
  }

  zoomOut(): ZoomChangeEvent {
    const zoomEvent = this.zoomController.zoomOut();
    this.handleZoomChange(zoomEvent.newZoom, zoomEvent);

    return zoomEvent;
  }

  async destroy(): Promise<void> {
    if (this.zoomController) {
      this.zoomController.destroy();
    }
    
    if (this.pinchController) {
      this.pinchController.destroy();
    }
    
    this.zoomHandlers = [];
    
    // Call parent destroy to clean up state handlers
    await super.destroy();
  }
}