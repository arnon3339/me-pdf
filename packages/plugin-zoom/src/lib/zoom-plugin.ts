import { 
  BasePluginConfig, 
  IPlugin,
  PluginRegistry 
} from "@embedpdf/core";
import { ZoomChangeEvent, ZoomLevel } from "./types";

export interface ZoomPluginConfig extends BasePluginConfig {
  defaultZoomLevel: ZoomLevel
}

interface ZoomCapability {
  onZoom(handler: (zoomEvent: ZoomChangeEvent) => void): void;
  updateZoomLevel(zoomLevel: ZoomLevel): Promise<void>;
}

export class ZoomPlugin implements IPlugin<ZoomPluginConfig> {
  private zoomHandlers: ((zoomEvent: ZoomChangeEvent) => void)[] = [];

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {
    
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