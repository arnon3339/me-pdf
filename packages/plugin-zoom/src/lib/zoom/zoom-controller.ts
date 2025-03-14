import { ViewportCapability, ViewportMetrics } from '@embedpdf/plugin-viewport';
import { PageManagerCapability } from '@embedpdf/plugin-page-manager';
import { ZoomLevel, ZoomChangeEvent, ZoomState } from '../types';

interface ZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

interface IZoomControllerOptions {
  viewport: ViewportCapability;
  pageManager: PageManagerCapability;
  options: ZoomOptions;
  state: ZoomState;
}

export class ZoomController {
  private readonly minZoom: number;
  private readonly maxZoom: number;
  private readonly zoomStep: number;

  private container: HTMLElement;
  private state: ZoomState;
  private pageManager: PageManagerCapability;
  private viewport: ViewportCapability;

  constructor(options: IZoomControllerOptions) {
    this.viewport = options.viewport;
    this.pageManager = options.pageManager;
    this.state = options.state;
    this.minZoom = options.options.minZoom ?? 0.25;
    this.maxZoom = options.options.maxZoom ?? 10;
    this.zoomStep = options.options.zoomStep ?? 0.1;
    this.container = this.viewport.getContainer();
  }

  /**
   * Calculates the zoom level based on the specified mode.
   * @param mode The zoom mode to compute.
   * @returns The calculated zoom level, clamped between minZoom and maxZoom.
   */
  private calculateZoomLevel(mode: 'automatic' | 'fit-page' | 'fit-width'): number {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const spreadPages = this.pageManager.getSpreadPages();
    const pageGap = this.pageManager.getPageGap();
    const viewportGap = this.viewport.getViewportGap();

    if (!spreadPages.length) return 1;

    let maxWidth = 0;
    let maxHeight = 0;
    spreadPages.forEach((spread) => {
      const spreadWidth =
        spread.reduce((width, page, index) => {
          return width + page.size.width + (index > 0 ? pageGap : 0);
        }, 0) + 2 * viewportGap;
      const spreadHeight = Math.max(...spread.map((page) => page.size.height)) + 2 * viewportGap;
      maxWidth = Math.max(maxWidth, spreadWidth);
      maxHeight = Math.max(maxHeight, spreadHeight);
    });

    let zoom: number;
    switch (mode) {
      case 'fit-width':
        zoom = containerWidth / maxWidth;
        break;
      case 'fit-page':
        zoom = Math.min(containerWidth / maxWidth, containerHeight / maxHeight);
        break;
      case 'automatic':
        zoom = Math.min(containerWidth / maxWidth, 1);
        break;
      default:
        zoom = 1; // Fallback, though TypeScript ensures mode is valid
    }
    return Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
  }

  /**
   * Applies a new zoom level, updating the state and DOM, and adjusting scroll position.
   * @param newZoomLevel The target zoom level (number or mode).
   * @param center Optional center point for zoom (e.g., from pinch).
   * @returns ZoomChangeEvent with old and new zoom details.
   */
  public zoomTo(newZoomLevel: ZoomLevel, center?: { x: number; y: number }): ZoomChangeEvent {
    const oldZoom = this.state.currentZoomLevel;
    const oldMetrics = this.viewport.getMetrics();

    // Determine the new zoom level
    const newZoom = typeof newZoomLevel === 'number'
      ? Math.min(Math.max(newZoomLevel, this.minZoom), this.maxZoom)
      : this.calculateZoomLevel(newZoomLevel);

    // Update state and apply zoom
    this.state.currentZoomLevel = newZoom;
    this.container.style.setProperty('--scale-factor', `${newZoom}`);

    // Adjust scroll position after zoom
    const newMetrics = this.viewport.getMetrics();
    this.adjustScrollPosition(oldMetrics, newMetrics, center);

    return {
      oldZoom,
      oldMetrics,
      newZoom,
      newMetrics,
      center,
    };
  }

  /**
   * Adjusts the scroll position after a zoom change.
   * @param oldMetrics Metrics before zoom.
   * @param newMetrics Metrics after zoom.
   * @param center Optional center point for zoom adjustment.
   */
  private adjustScrollPosition(
    oldMetrics: ViewportMetrics,
    newMetrics: ViewportMetrics,
    center?: { x: number; y: number }
  ): void {
    const container = this.viewport.getContainer();

    if (center) {
      const oldZoom = oldMetrics.scrollHeight / newMetrics.scrollHeight * this.state.currentZoomLevel;
      const zoomRatio = this.state.currentZoomLevel / oldZoom;
      const newScrollLeft = (center.x + oldMetrics.scrollLeft) * zoomRatio - center.x;
      const newScrollTop = (center.y + oldMetrics.scrollTop) * zoomRatio - center.y;
      container.scrollLeft = newScrollLeft;
      container.scrollTop = newScrollTop;
    } else {
      let newScrollTop = oldMetrics.relativePosition.y * (newMetrics.scrollHeight - newMetrics.clientHeight);
      let newScrollLeft;

      if (oldMetrics.scrollWidth <= oldMetrics.clientWidth && newMetrics.scrollWidth > newMetrics.clientWidth) {
        newScrollLeft = (newMetrics.scrollWidth - newMetrics.clientWidth) / 2;
      } else {
        newScrollLeft = oldMetrics.relativePosition.x * (newMetrics.scrollWidth - newMetrics.clientWidth);
      }

      container.scrollLeft = newScrollLeft;
      container.scrollTop = newScrollTop;
    }
  }

  /**
   * Zooms by a delta value relative to the current zoom level.
   * @param delta The amount to adjust the zoom by.
   * @param center Optional center point for zoom.
   */
  public zoomBy(delta: number, center?: { x: number; y: number }): ZoomChangeEvent {
    return this.zoomTo(this.state.currentZoomLevel + delta, center);
  }

  /**
   * Zooms in by the zoom step.
   * @returns ZoomChangeEvent with old and new zoom details.
   */
  public zoomIn(): ZoomChangeEvent {
    return this.zoomBy(this.zoomStep);
  }

  /**
   * Zooms out by the zoom step.
   * @returns ZoomChangeEvent with old and new zoom details.
   */
  public zoomOut(): ZoomChangeEvent {
    return this.zoomBy(-this.zoomStep);
  }

  /**
   * Cleans up resources. No resize observer to disconnect now.
   */
  public destroy(): void {
    // Nothing to clean up since resize handling is removed
  }
}