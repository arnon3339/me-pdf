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
} from "@embedpdf/core";

import {
  ViewportPlugin,    ViewportCapability,
  ViewportMetrics
} from "@embedpdf/plugin-viewport";
import { ScrollPlugin, ScrollCapability } from "@embedpdf/plugin-scroll";
import {
  ZoomPluginConfig,
  ZoomState,
  ZoomLevel,
  ZoomMode,
  Point,
  ZoomChangeEvent,
  ZoomCapability,
  ZoomPreset,
  ZoomRangeStep,
  VerticalZoomFocus,
  ZoomRequest,
} from "./types";
import { setInitialZoomLevel, setZoomLevel, ZoomAction }   from "./actions";

export class ZoomPlugin
  extends BasePlugin<
    ZoomPluginConfig,
    ZoomCapability,
    ZoomState,
    ZoomAction
  > {
  static readonly id = 'zoom' as const;
  /* ------------------------------------------------------------------ */
  /* internals                                                           */
  /* ------------------------------------------------------------------ */
  private readonly zoom$     = createEmitter<ZoomChangeEvent>();
  private readonly viewport  : ViewportCapability;
  private readonly scroll    : ScrollCapability;
  private readonly presets   : ZoomPreset[];
  private readonly zoomRanges: ZoomRangeStep[];

  private readonly minZoom   : number;
  private readonly maxZoom   : number;
  private readonly zoomStep  : number;

  /* ------------------------------------------------------------------ */
  constructor(id: string, registry: PluginRegistry, cfg: ZoomPluginConfig) {
    super(id, registry);

    this.viewport = registry.getPlugin<ViewportPlugin>('viewport')!.provides();
    this.scroll = registry.getPlugin<ScrollPlugin>('scroll')!.provides();
    this.minZoom  = cfg.minZoom ?? 0.25;
    this.maxZoom  = cfg.maxZoom ?? 10;
    this.zoomStep = cfg.zoomStep ?? 0.1;
    this.presets  = cfg.presets ?? [];
    this.zoomRanges = this.normalizeRanges(cfg.zoomRanges ?? []);
    this.dispatch(setInitialZoomLevel(cfg.defaultZoomLevel));
    /* keep "automatic" modes up to date -------------------------------- */
    this.viewport.onViewportChange (() => this.recalcAuto(VerticalZoomFocus.Top), { mode:"debounce", wait:150 });
    this.coreStore.onAction(SET_ROTATION, () => this.recalcAuto(VerticalZoomFocus.Top));
    this.coreStore.onAction(SET_PAGES, () => this.recalcAuto(VerticalZoomFocus.Top));
    this.coreStore.onAction(SET_DOCUMENT, () => this.recalcAuto(VerticalZoomFocus.Top));
    this.resetReady();
  }

  /* ------------------------------------------------------------------ */
  /* capability                                                          */
  /* ------------------------------------------------------------------ */
  protected buildCapability(): ZoomCapability {
    return {
      onZoomChange : this.zoom$.on,
      zoomIn       : () => {
        const cur = this.state.currentZoomLevel;
        return this.handleRequest({ level: cur, delta: this.stepFor(cur) });
      },
      zoomOut      : () => {
        const cur = this.state.currentZoomLevel;
        return this.handleRequest({ level: cur, delta: -this.stepFor(cur) });
      },
      requestZoom  : (level, c) => this.handleRequest({ level, center: c }),
      requestZoomBy: (d,c)    => {
        const cur = this.state.currentZoomLevel;
        const target = this.toZoom(cur + d);
        return this.handleRequest({ level: target, center: c });
      },
      getState     : () => this.state,
      getPresets   : () => this.presets,
    };
  }

  /* ------------------------------------------------------------------ */
  /* plugin life‑cycle                                                   */
  /* ------------------------------------------------------------------ */
  async initialize(cfg: ZoomPluginConfig): Promise<void> {
    /* apply the initial zoom                                              */

  }

  async destroy() { this.zoom$.clear(); }

  /**
   * Sort ranges once, make sure they are sane
   */
  private normalizeRanges(ranges: ZoomRangeStep[]): ZoomRangeStep[] {
    return [...ranges]
      .filter(r => r.step > 0 && r.max > r.min)      // basic sanity
      .sort((a, b) => a.min - b.min);
  }

  /** pick the step that applies to a given numeric zoom */
  private stepFor(zoom: number): number {
    const r = this.zoomRanges.find(r => zoom >= r.min && zoom < r.max);
    return r ? r.step : this.zoomStep;              // fallback
  }

  /** clamp + round helper reused later */
  private toZoom(v: number) {
    return parseFloat(clamp(v, this.minZoom, this.maxZoom).toFixed(2));
  }

  /* ------------------------------------------------------------------ */
  /* main entry – handles **every** zoom request                          */
  /* ------------------------------------------------------------------ */
  private handleRequest(
    {
      level,
      delta = 0,
      center,
      focus = VerticalZoomFocus.Center
    }: ZoomRequest
  ) {
    const metrics    = this.viewport.getMetrics();
    const oldZoom    = this.state.currentZoomLevel;

    if(metrics.clientWidth === 0 || metrics.clientHeight === 0) {
      return;
    }

    /* ------------------------------------------------------------------ */
    /* step 1 – resolve the **target numeric zoom**                        */
    /* ------------------------------------------------------------------ */
    const base =
      typeof level === "number"
        ? level
        : this.computeZoomForMode(level, metrics);

    if(base === false) {
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
    const { desiredScrollLeft, desiredScrollTop } =
      this.computeScrollForZoomChange(metrics, oldZoom, newZoom, focusPoint);

    /* ------------------------------------------------------------------ */
    /* step 4 – dispatch + notify                                          */
    /* ------------------------------------------------------------------ */

    if(!isNaN(desiredScrollLeft) && !isNaN(desiredScrollTop)) {
      this.viewport.setViewportScrollMetrics({
        scrollLeft: desiredScrollLeft,
        scrollTop: desiredScrollTop,
      });
    }

    this.dispatch(setZoomLevel(typeof level === "number" ? newZoom : level, newZoom));
    this.dispatchCoreAction(setScale(newZoom));
    this.markReady();

    this.viewport.scrollTo({
      x: desiredScrollLeft,
      y: desiredScrollTop,
      behavior: 'instant',
    });

    const evt: ZoomChangeEvent = {
      oldZoom, newZoom, level, center: focusPoint,
      desiredScrollLeft, desiredScrollTop,
      viewport: metrics,
    };

    this.zoom$.emit(evt);
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */

  /** numeric zoom for Automatic / FitPage / FitWidth */
  private computeZoomForMode(mode: ZoomMode, vp: ViewportMetrics): number | false {
    const spreads   = getPagesWithRotatedSize(this.coreState.core);
    if (!spreads.length) return false;

    const pgGap     = this.scroll.getPageGap();
    const vpGap     = this.viewport.getViewportGap();

    if(vp.clientWidth === 0 || vp.clientHeight === 0) {
      return false;
    }

    let maxW = 0, maxH = 0;

    spreads.forEach(spread => {
      const w = spread.reduce((s,p,i)=> s + p.rotatedSize.width + (i?pgGap:0), 0) + 2*vpGap;
      const h = Math.max(...spread.map(p=>p.rotatedSize.height))                 + 2*vpGap;
      maxW = Math.max(maxW, w);
      maxH = Math.max(maxH, h);
    });

    switch (mode) {
      case ZoomMode.FitWidth : return vp.clientWidth  / maxW;
      case ZoomMode.FitPage  : return Math.min(vp.clientWidth / maxW,
                                               vp.clientHeight/ maxH);
      case ZoomMode.Automatic: return Math.min(vp.clientWidth / maxW, 1);
      /* istanbul ignore next */
      default                : return 1;
    }
  }

  /** where to scroll so that *focus* stays stable after scaling          */
  private computeScrollForZoomChange(
    vp: ViewportMetrics,
    oldZoom: number,
    newZoom: number,
    focus: Point
  ) {
    /* unscaled content size ------------------------------------------- */
    const layout    = this.scroll.getLayout();
    const vpGap     = this.viewport.getViewportGap();

    const contentW  = layout.totalContentSize.width;
    const contentH  = layout.totalContentSize.height;

    /* helper: offset if content is narrower than viewport -------------- */
    const off = (vw:number, cw:number, zoom:number) =>
      cw*zoom < vw ? (vw - cw*zoom)/2 : 0;

    const offXold = off(vp.clientWidth , contentW, oldZoom);
    const offYold = off(vp.clientHeight, contentH, oldZoom);

    const offXnew = off(vp.clientWidth , contentW, newZoom);
    const offYnew = off(vp.clientHeight, contentH, newZoom);

    /* content coords of the focal point -------------------------------- */
    const cx = (vp.scrollLeft + focus.vx - offXold) / oldZoom;
    const cy = (vp.scrollTop  + focus.vy - offYold) / oldZoom;

    /* new scroll so that (cx,cy) appears under focus again ------------- */
    const desiredScrollLeft =
      cx*newZoom + offXnew - focus.vx;

    const desiredScrollTop  =
      cy*newZoom + offYnew - focus.vy;

    return {
      desiredScrollLeft: Math.max(0, desiredScrollLeft),
      desiredScrollTop: Math.max(0, desiredScrollTop),
    };
  }

  /** recalculates Automatic / Fit* when viewport or pages change */
  private recalcAuto(focus?: VerticalZoomFocus) {
    const s = this.state;
    if (
      s.zoomLevel === ZoomMode.Automatic ||
      s.zoomLevel === ZoomMode.FitPage   ||
      s.zoomLevel === ZoomMode.FitWidth
    ) this.handleRequest({ level: s.zoomLevel, focus });
  }
}
