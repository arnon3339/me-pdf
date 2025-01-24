import { PdfPageObject } from '@cloudpdf/models';
import { BaseLayer } from '@cloudpdf/plugin-layer';
import { NavigationPlugin } from '../NavigationPlugin';
import { ViewportState } from '../types';

export class RenderLayer extends BaseLayer {
  readonly id = 'render';
  readonly zIndex = 1;
  private cleanupListeners: (() => void)[] = [];
  private viewportState: ViewportState | null = null;
  private pageOverlays: Map<number, HTMLDivElement> = new Map();

  async render(page: PdfPageObject, container: HTMLElement) {
    if(!this.core) throw new Error('Plugin not initialized');

    const navigationPlugin = this.core.getPlugin<NavigationPlugin>('navigation');
    if(!navigationPlugin) throw new Error('Navigation plugin not initialized');

    const viewportState = navigationPlugin.getViewportState();
    this.viewportStateHandler(page, container, viewportState);
  
    const cleanup = this.core.on('navigation:viewportStateChanged', (viewportState) => this.viewportStateHandler(page, container, viewportState));

    this.cleanupListeners.push(cleanup);
  }

  private viewportStateHandler = (page: PdfPageObject, container: HTMLElement, viewportState: ViewportState) => {
    this.viewportState = viewportState;
  
    // Find the viewport region for this page
    const region = viewportState.viewportRegions.find(r => r.pageNumber === page.index + 1);
    
    if (region) {
      // Page is visible - create or update overlay
      let overlay = this.pageOverlays.get(page.index);
      
      if (!overlay) {
        // Create new overlay if it doesn't exist
        overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.pointerEvents = 'none';
        overlay.style.backgroundColor = 'red';
        container.appendChild(overlay);
        this.pageOverlays.set(page.index, overlay);
      }

      // Update overlay position and dimensions
      overlay.style.left = `round(down, var(--scale-factor) * ${region.pageX}px, 1px)`;
      overlay.style.top = `round(down, var(--scale-factor) * ${region.pageY}px, 1px)`;
      overlay.style.width = `round(down, var(--scale-factor) * ${region.visibleWidth}px, 1px)`;
      overlay.style.height = `round(down, var(--scale-factor) * ${region.visibleHeight}px, 1px)`;
    } else {
      // Page is not visible - remove overlay if it exists
      const overlay = this.pageOverlays.get(page.index);
      if (overlay) {
        overlay.remove();
        this.pageOverlays.delete(page.index);
      }
    }
  }

  async destroy() {
    // Clean up all overlays
    this.pageOverlays.forEach(overlay => overlay.remove());
    this.pageOverlays.clear();
    
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    
    await super.destroy();
  }
}