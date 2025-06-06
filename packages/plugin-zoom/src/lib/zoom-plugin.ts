import {
  BasePlugin,
  PluginRegistry,
  createEmitter,
  clamp,
  setScale,
  SET_PAGES,
  SET_DOCUMENT,
  getPagesWithRotatedSize,
  SET_ROTATION,
} from '@embedpdf/core';
import { ScrollPlugin, ScrollCapability } from '@embedpdf/plugin-scroll';
import { ViewportPlugin, ViewportCapability, ViewportMetrics } from '@embedpdf/plugin-viewport';

import { setInitialZoomLevel, setZoomLevel, ZoomAction } from './actions';
import {
  ZoomPluginConfig,
  ZoomState,
  ZoomMode,
  Point,
  ZoomChangeEvent,
  ZoomCapability,
  ZoomPreset,
  ZoomRangeStep,
  VerticalZoomFocus,
  ZoomRequest,
} from './types';
import {
  InteractionManagerCapability,
  InteractionManagerPlugin,
} from '@embedpdf/plugin-interaction-manager';
import { Rect } from '@embedpdf/models';

export class ZoomPlugin extends BasePlugin<
  ZoomPluginConfig,
  ZoomCapability,
  ZoomState,
  ZoomAction
> {
  static readonly id = 'zoom' as const;
  /* ------------------------------------------------------------------ */
  /* internals                                                           */
  /* ------------------------------------------------------------------ */
  private readonly zoom$ = createEmitter<ZoomChangeEvent>();
  private readonly viewport: ViewportCapability;
  private readonly scroll: ScrollCapability;
  private readonly interactionManager: InteractionManagerCapability | null;
  private readonly presets: ZoomPreset[];
  private readonly zoomRanges: ZoomRangeStep[];

  private readonly minZoom: number;
  private readonly maxZoom: number;
  private readonly zoomStep: number;

  /* ------------------------------------------------------------------ */
  constructor(id: string, registry: PluginRegistry, cfg: ZoomPluginConfig) {
    super(id, registry);

    this.viewport = registry.getPlugin<ViewportPlugin>('viewport')!.provides();
    this.scroll = registry.getPlugin<ScrollPlugin>('scroll')!.provides();
    const interactionManager = registry.getPlugin<InteractionManagerPlugin>('interaction-manager');
    this.interactionManager = interactionManager?.provides() ?? null;
    this.minZoom = cfg.minZoom ?? 0.25;
    this.maxZoom = cfg.maxZoom ?? 10;
    this.zoomStep = cfg.zoomStep ?? 0.1;
    this.presets = cfg.presets ?? [];
    this.zoomRanges = this.normalizeRanges(cfg.zoomRanges ?? []);
    this.dispatch(setInitialZoomLevel(cfg.defaultZoomLevel));
    /* keep "automatic" modes up to date -------------------------------- */
    this.viewport.onViewportChange(() => this.recalcAuto(VerticalZoomFocus.Top), {
      mode: 'debounce',
      wait: 150,
    });
    this.coreStore.onAction(SET_ROTATION, () => this.recalcAuto(VerticalZoomFocus.Top));
    this.coreStore.onAction(SET_PAGES, () => this.recalcAuto(VerticalZoomFocus.Top));
    this.coreStore.onAction(SET_DOCUMENT, () => this.recalcAuto(VerticalZoomFocus.Top));
    this.interactionManager?.registerMode({
      id: 'marqueeZoom',
      scope: 'page',
      exclusive: true,
      cursor: 'zoom-in',
    });
    this.resetReady();
  }

  /* ------------------------------------------------------------------ */
  /* capability                                                          */
  /* ------------------------------------------------------------------ */
  protected buildCapability(): ZoomCapability {
    return {
      onZoomChange: this.zoom$.on,
      zoomIn: () => {
        const cur = this.state.currentZoomLevel;
        return this.handleRequest({ level: cur, delta: this.stepFor(cur) });
      },
      zoomOut: () => {
        const cur = this.state.currentZoomLevel;
        return this.handleRequest({ level: cur, delta: -this.stepFor(cur) });
      },
      zoomToArea: (pageIndex, rect) => this.handleZoomToArea(pageIndex, rect),
      requestZoom: (level, c) => this.handleRequest({ level, center: c }),
      requestZoomBy: (d, c) => {
        const cur = this.state.currentZoomLevel;
        const target = this.toZoom(cur + d);
        return this.handleRequest({ level: target, center: c });
      },
      enableMarqueeZoom: () => {
        this.interactionManager?.activate('marqueeZoom');
      },
      disableMarqueeZoom: () => {
        this.interactionManager?.activate('default');
      },
      isMarqueeZoomActive: () => this.interactionManager?.getActiveMode() === 'marqueeZoom',
      getState: () => this.state,
      getPresets: () => this.presets,
    };
  }

  /* ------------------------------------------------------------------ */
  /* plugin life‑cycle                                                   */
  /* ------------------------------------------------------------------ */
  async initialize(): Promise<void> {
    /* apply the initial zoom                                              */
  }

  async destroy() {
    this.zoom$.clear();
  }

  /**
   * Sort ranges once, make sure they are sane
   */
  private normalizeRanges(ranges: ZoomRangeStep[]): ZoomRangeStep[] {
    return [...ranges]
      .filter((r) => r.step > 0 && r.max > r.min) // basic sanity
      .sort((a, b) => a.min - b.min);
  }

  /** pick the step that applies to a given numeric zoom */
  private stepFor(zoom: number): number {
    const r = this.zoomRanges.find((r) => zoom >= r.min && zoom < r.max);
    return r ? r.step : this.zoomStep; // fallback
  }

  /** clamp + round helper reused later */
  private toZoom(v: number) {
    return parseFloat(clamp(v, this.minZoom, this.maxZoom).toFixed(2));
  }

  /* ------------------------------------------------------------------ */
  /* main entry – handles **every** zoom request                          */
  /* ------------------------------------------------------------------ */
  private handleRequest({
    level,
    delta = 0,
    center,
    focus = VerticalZoomFocus.Center,
  }: ZoomRequest) {
    const metrics = this.viewport.getMetrics();
    const oldZoom = this.state.currentZoomLevel;

    if (metrics.clientWidth === 0 || metrics.clientHeight === 0) {
      return;
    }

    /* ------------------------------------------------------------------ */
    /* step 1 – resolve the **target numeric zoom**                        */
    /* ------------------------------------------------------------------ */
    const base = typeof level === 'number' ? level : this.computeZoomForMode(level, metrics);

    if (base === false) {
      return;
    }

    const newZoom = parseFloat(clamp(base + delta, this.minZoom, this.maxZoom).toFixed(2));

    /* ------------------------------------------------------------------ */
    /* step 2 – figure out the viewport point we should keep under focus   */
    /* ------------------------------------------------------------------ */
    const focusPoint: Point = center ?? {
      vx: metrics.clientWidth / 2,
      vy: focus === VerticalZoomFocus.Top ? 0 : metrics.clientHeight / 2,
    };

    /* ------------------------------------------------------------------ */
    /* step 3 – translate that into desired scroll offsets                 */
    /* ------------------------------------------------------------------ */
    const { desiredScrollLeft, desiredScrollTop } = this.computeScrollForZoomChange(
      metrics,
      oldZoom,
      newZoom,
      focusPoint,
    );

    /* ------------------------------------------------------------------ */
    /* step 4 – dispatch + notify                                          */
    /* ------------------------------------------------------------------ */

    if (!isNaN(desiredScrollLeft) && !isNaN(desiredScrollTop)) {
      this.viewport.setViewportScrollMetrics({
        scrollLeft: desiredScrollLeft,
        scrollTop: desiredScrollTop,
      });
    }

    this.dispatch(setZoomLevel(typeof level === 'number' ? newZoom : level, newZoom));
    this.dispatchCoreAction(setScale(newZoom));
    this.markReady();

    this.viewport.scrollTo({
      x: desiredScrollLeft,
      y: desiredScrollTop,
      behavior: 'instant',
    });

    const evt: ZoomChangeEvent = {
      oldZoom,
      newZoom,
      level,
      center: focusPoint,
      desiredScrollLeft,
      desiredScrollTop,
      viewport: metrics,
    };

    this.zoom$.emit(evt);
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */

  /** numeric zoom for Automatic / FitPage / FitWidth */
  private computeZoomForMode(mode: ZoomMode, vp: ViewportMetrics): number | false {
    const spreads = getPagesWithRotatedSize(this.coreState.core);
    if (!spreads.length) return false;

    const pgGap = this.scroll.getPageGap();
    const vpGap = this.viewport.getViewportGap();

    if (vp.clientWidth === 0 || vp.clientHeight === 0) {
      return false;
    }

    // Available space after accounting for fixed viewport gaps
    const availableWidth = vp.clientWidth - 2 * vpGap;
    const availableHeight = vp.clientHeight - 2 * vpGap;

    if (availableWidth <= 0 || availableHeight <= 0) {
      return false;
    }

    let maxContentW = 0,
      maxContentH = 0;

    spreads.forEach((spread) => {
      // Only include scalable content (pages + page gaps), not viewport gaps
      const contentW = spread.reduce((s, p, i) => s + p.rotatedSize.width + (i ? pgGap : 0), 0);
      const contentH = Math.max(...spread.map((p) => p.rotatedSize.height));
      maxContentW = Math.max(maxContentW, contentW);
      maxContentH = Math.max(maxContentH, contentH);
    });

    switch (mode) {
      case ZoomMode.FitWidth:
        return availableWidth / maxContentW;
      case ZoomMode.FitPage:
        return Math.min(availableWidth / maxContentW, availableHeight / maxContentH);
      case ZoomMode.Automatic:
        return Math.min(availableWidth / maxContentW, 1);
      /* istanbul ignore next */
      default:
        return 1;
    }
  }

  /** where to scroll so that *focus* stays stable after scaling          */
  private computeScrollForZoomChange(
    vp: ViewportMetrics,
    oldZoom: number,
    newZoom: number,
    focus: Point,
  ) {
    /* unscaled content size ------------------------------------------- */
    const layout = this.scroll.getLayout();
    const vpGap = this.viewport.getViewportGap();

    const contentW = layout.totalContentSize.width;
    const contentH = layout.totalContentSize.height;

    // Available space for content (excluding fixed viewport gaps)
    const availableWidth = vp.clientWidth - 2 * vpGap;
    const availableHeight = vp.clientHeight - 2 * vpGap;

    /* helper: offset if content is narrower than available space ------- */
    const off = (availableSpace: number, cw: number, zoom: number) =>
      cw * zoom < availableSpace ? (availableSpace - cw * zoom) / 2 : 0;

    const offXold = off(availableWidth, contentW, oldZoom);
    const offYold = off(availableHeight, contentH, oldZoom);

    const offXnew = off(availableWidth, contentW, newZoom);
    const offYnew = off(availableHeight, contentH, newZoom);

    /* content coords of the focal point -------------------------------- */
    // Adjust focus point to account for vpGap and centering offset
    const cx = (vp.scrollLeft + focus.vx - vpGap - offXold) / oldZoom;
    const cy = (vp.scrollTop + focus.vy - vpGap - offYold) / oldZoom;

    /* new scroll so that (cx,cy) appears under focus again ------------- */
    const desiredScrollLeft = cx * newZoom + vpGap + offXnew - focus.vx;
    const desiredScrollTop = cy * newZoom + vpGap + offYnew - focus.vy;

    return {
      desiredScrollLeft: Math.max(0, desiredScrollLeft),
      desiredScrollTop: Math.max(0, desiredScrollTop),
    };
  }

  private handleZoomToArea(pageIndex: number, rect: Rect) {
    const vp = this.viewport.getMetrics();
    const oldZ = this.state.currentZoomLevel;

    /* 1 – numeric zoom so the rect fits -------------------------------- */
    const targetZoom = this.toZoom(
      Math.min((vp.clientWidth - 2) / rect.size.width, (vp.clientHeight - 2) / rect.size.height),
    );

    /* 2 – centre of the rect in *content* coordinates ------------------ */
    const layout = this.scroll.getLayout();
    const pageLayout = layout.virtualItems
      .flatMap((p) => p.pageLayouts)
      .find((p) => p.pageIndex === pageIndex);

    if (!pageLayout) return;

    const cxContent = pageLayout.x + rect.origin.x + rect.size.width / 2;
    const cyContent = pageLayout.y + rect.origin.y + rect.size.height / 2;

    /* 3 – viewport coords of that centre *before* zoom ----------------- */
    const centerVX = cxContent * oldZ - vp.scrollLeft;
    const centerVY = cyContent * oldZ - vp.scrollTop;

    /* 4 – reuse the generic handler ------------------------------------ */
    this.handleRequest({
      level: targetZoom,
      center: { vx: centerVX, vy: centerVY },
    });
  }

  /** recalculates Automatic / Fit* when viewport or pages change */
  private recalcAuto(focus?: VerticalZoomFocus) {
    const s = this.state;
    if (
      s.zoomLevel === ZoomMode.Automatic ||
      s.zoomLevel === ZoomMode.FitPage ||
      s.zoomLevel === ZoomMode.FitWidth
    )
      this.handleRequest({ level: s.zoomLevel, focus });
  }
}
