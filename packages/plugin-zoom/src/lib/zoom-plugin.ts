import { 
  IPlugin,
  PluginRegistry 
} from "@embedpdf/core";
import { ViewportCapability, ViewportPlugin } from "@embedpdf/plugin-viewport";
import { ZoomCapability, ZoomChangeEvent, ZoomLevel, ZoomPluginConfig } from "./types";

export class ZoomPlugin implements IPlugin<ZoomPluginConfig> {
  private zoomHandlers: ((zoomEvent: ZoomChangeEvent) => void)[] = [];
  private viewport: ViewportCapability;

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {
    this.viewport = this.registry.getPlugin<ViewportPlugin>('viewport').provides();
    console.log('ZoomPlugin initialized with viewport:', this.viewport);
  }

  provides(): ZoomCapability {
    return {
      onZoom: (handler) => this.zoomHandlers.push(handler),
      updateZoomLevel: (zoomLevel) => this.updateZoomLevel(zoomLevel)
    };
  }

  async initialize(config: ZoomPluginConfig): Promise<void> {
    console.log('ZoomPlugin initialized with config:', config);
  }

  async updateZoomLevel(zoomLevel: ZoomLevel): Promise<void> {

  }
}