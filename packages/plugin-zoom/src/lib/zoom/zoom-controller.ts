import { ViewportCapability, ViewportMetrics } from '@embedpdf/plugin-viewport';
import { PageManagerCapability } from '@embedpdf/plugin-page-manager';
import { ZoomLevel, ZoomChangeEvent, ZoomState, ZoomMode } from '../types';

interface ZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

interface IZoomControllerOptions {
  viewport: ViewportCapability;
  pageManager: PageManagerCapability;
  options: ZoomOptions;
  getState: () => ZoomState;
}

/**
 * Manages zooming functionality within the PDF viewer
 */
export class ZoomController {
  private readonly minZoom: number;
  private readonly maxZoom: number;
  private readonly zoomStep: number;
  private container: HTMLElement;
  private getState: () => ZoomState;
  private pageManager: PageManagerCapability;
  private viewport: ViewportCapability;

  /**
   * Creates a new zoom controller instance
   * @param options Configuration options for the zoom controller
   */
  constructor(options: IZoomControllerOptions) {
    this.viewport = options.viewport;
    this.pageManager = options.pageManager;
    this.getState = options.getState;
    this.minZoom = options.options.minZoom ?? 0.25;
    this.maxZoom = options.options.maxZoom ?? 10;
    this.zoomStep = options.options.zoomStep ?? 0.1;
    this.container = this.viewport.getContainer();
  }

  /**
   * Calculates the offset needed to center content within the viewport
   * @param viewportSize Size of the viewport dimension
   * @param contentSize Size of the content dimension
   * @param scale Current zoom scale
   * @returns The offset value to use for centering
   */
  private calculateOffset(viewportSize: number, contentSize: number, scale: number): number {
    const scaledContentSize = contentSize * scale;
    return scaledContentSize < viewportSize ? (viewportSize - scaledContentSize) / 2 : 0;
  }

  /**
   * Converts viewport coordinates to content coordinates
   * @param vx X-coordinate in viewport space
   * @param vy Y-coordinate in viewport space
   * @param scale Current zoom scale
   * @param scrollLeft Current horizontal scroll position
   * @param scrollTop Current vertical scroll position
   * @returns Content coordinates corresponding to the given viewport coordinates
   */
  private getContentPoint(
    vx: number,
    vy: number,
    scale: number,
    scrollLeft: number,
    scrollTop: number
  ): { cx: number; cy: number } {
    const { width: contentWidth, height: contentHeight } = this.getContentDimensions();
    const viewportWidth = this.container.clientWidth;
    const viewportHeight = this.container.clientHeight;
    const offsetX = this.calculateOffset(viewportWidth, contentWidth, scale);
    const offsetY = this.calculateOffset(viewportHeight, contentHeight, scale);
    const cx = (vx - offsetX + scrollLeft) / scale;
    const cy = (vy - offsetY + scrollTop) / scale;
    return { cx, cy };
  }

  /**
   * Calculates new scroll positions after zoom changes
   * @param cx X-coordinate in content space
   * @param cy Y-coordinate in content space
   * @param newScale New zoom scale to apply
   * @param targetVx Target X-coordinate in viewport to maintain
   * @param targetVy Target Y-coordinate in viewport to maintain
   * @returns New scroll positions to maintain the focal point
   */
  private calculateNewScroll(
    cx: number,
    cy: number,
    newScale: number,
    targetVx: number,
    targetVy: number
  ): { newScrollLeft: number; newScrollTop: number } {
    const { width: contentWidth, height: contentHeight } = this.getContentDimensions();
    const viewportWidth = this.container.clientWidth;
    const viewportHeight = this.container.clientHeight;
    const newOffsetX = this.calculateOffset(viewportWidth, contentWidth, newScale);
    const newOffsetY = this.calculateOffset(viewportHeight, contentHeight, newScale);
    const newScrollLeft = cx * newScale + newOffsetX - targetVx;
    const newScrollTop = cy * newScale + newOffsetY - targetVy;
    return { newScrollLeft, newScrollTop };
  }

  /**
   * Gets the dimensions of the content at a 1:1 scale
   * @returns The unscaled width and height of the content
   */
  private getContentDimensions(): { width: number; height: number } {
    const innerDiv = this.viewport.getInnerDiv();
    const viewportGap = this.viewport.getViewportGap();
    const currentScale = this.getState().currentZoomLevel;
    const scaledWidth = innerDiv.clientWidth;
    const scaledHeight = innerDiv.clientHeight;
    return {
      width: Math.ceil((scaledWidth / currentScale)) + 2 * viewportGap,
      height: Math.ceil((scaledHeight / currentScale)) + 2 * viewportGap
    };
  }

  /**
   * Calculates the appropriate zoom level based on the specified mode
   * @param mode The zoom mode to calculate ('automatic', 'fit-page', or 'fit-width')
   * @returns The calculated zoom level that satisfies the mode's requirements
   */
  private calculateZoomLevel(mode: ZoomMode): number {
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
      case ZoomMode.FitWidth:
        zoom = containerWidth / maxWidth;
        break;
      case ZoomMode.FitPage:
        zoom = Math.min(containerWidth / maxWidth, containerHeight / maxHeight);
        break;
      case ZoomMode.Automatic:
        zoom = Math.min(containerWidth / maxWidth, 1);
        break;
      default:
        zoom = 1;
    }
    return Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
  }

  /**
   * Sets the zoom level to a specific value or mode
   * @param newZoomLevel The target zoom level, either a specific scale or a zoom mode
   * @param center Optional center point to maintain while zooming
   * @returns Event object containing information about the zoom change
   */
  public zoomTo(newZoomLevel: ZoomLevel, center?: { x: number; y: number }): ZoomChangeEvent {
    const oldZoom = this.getState().currentZoomLevel;
    const oldMetrics = this.viewport.getMetrics();

    const newZoom = typeof newZoomLevel === 'number'
      ? Math.min(Math.max(newZoomLevel, this.minZoom), this.maxZoom)
      : this.calculateZoomLevel(newZoomLevel);

    const { scrollLeft, scrollTop } = this.adjustScrollPosition(oldMetrics, oldZoom, newZoom, center);

    this.container.style.setProperty('--scale-factor', `${newZoom}`);

    requestAnimationFrame(() => {
      this.container.scrollLeft = scrollLeft;
      this.container.scrollTop = scrollTop;
    });

    return { oldZoom, oldMetrics, newZoom, center };
  }

  /**
   * Adjusts the scroll position after a zoom change to maintain the focal point
   * @param oldMetrics Previous viewport metrics
   * @param oldZoom Previous zoom level
   * @param newZoom New zoom level
   * @param center Optional focal point to maintain during zoom
   */
  private adjustScrollPosition(
    oldMetrics: ViewportMetrics,
    oldZoom: number,
    newZoom: number,
    center?: { x: number; y: number }
  ): { scrollLeft: number; scrollTop: number } {


    if (center) {
      const { cx, cy } = this.getContentPoint(center.x, center.y, oldZoom, oldMetrics.scrollLeft, oldMetrics.scrollTop);
      const { newScrollLeft, newScrollTop } = this.calculateNewScroll(cx, cy, newZoom, center.x, center.y);

      return { scrollLeft: Math.max(0, newScrollLeft), scrollTop: Math.max(0, newScrollTop) };
    } else {
      const viewportCenterX = oldMetrics.clientWidth / 2;
      const viewportCenterY = oldMetrics.clientHeight / 2;
      const { cx, cy } = this.getContentPoint(viewportCenterX, viewportCenterY, oldZoom, oldMetrics.scrollLeft, oldMetrics.scrollTop);
      const { newScrollLeft, newScrollTop } = this.calculateNewScroll(cx, cy, newZoom, viewportCenterX, viewportCenterY);

      return { scrollLeft: Math.max(0, newScrollLeft), scrollTop: Math.max(0, newScrollTop) };
    }
  }

  /**
   * Adjusts the zoom level by a relative delta value
   * @param delta The amount to adjust the zoom by (can be positive or negative)
   * @param center Optional center point to maintain while zooming
   * @returns Event object containing information about the zoom change
   */
  public zoomBy(delta: number, center?: { x: number; y: number }): ZoomChangeEvent {
    return this.zoomTo(this.getState().currentZoomLevel + delta, center);
  }

  /**
   * Increases the zoom level by the predefined zoom step
   * @returns Event object containing information about the zoom change
   */
  public zoomIn(): ZoomChangeEvent {
    return this.zoomBy(this.zoomStep);
  }

  /**
   * Decreases the zoom level by the predefined zoom step
   * @returns Event object containing information about the zoom change
   */
  public zoomOut(): ZoomChangeEvent {
    return this.zoomBy(-this.zoomStep);
  }

  /**
   * Cleans up resources used by the zoom controller
   */
  public destroy(): void {
    // Nothing to clean up
  }
}