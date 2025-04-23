import {
  BasePlugin,
  PluginRegistry,
  createEmitter,
  clamp,
  setScale,
} from "@embedpdf/core";

import {
  ViewportPlugin,    ViewportCapability,
  ViewportMetrics
} from "@embedpdf/plugin-viewport";
import {
  PageManagerPlugin, PageManagerCapability
} from "@embedpdf/plugin-page-manager";

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
} from "./types";
import { setZoomLevel, ZoomAction }   from "./actions";

export class ZoomPlugin
  extends BasePlugin<
    ZoomPluginConfig,
    ZoomCapability,
    ZoomState,
    ZoomAction
  > {

  /* ------------------------------------------------------------------ */
  /* internals                                                           */
  /* ------------------------------------------------------------------ */
  private readonly zoom$     = createEmitter<ZoomChangeEvent>();
  private readonly viewport  : ViewportCapability;
  private readonly pageMgr   : PageManagerCapability;
  private readonly presets   : ZoomPreset[];
  private readonly zoomRanges: ZoomRangeStep[];

  private readonly minZoom   : number;
  private readonly maxZoom   : number;
  private readonly zoomStep  : number;

  /* ------------------------------------------------------------------ */
  constructor(id: string, registry: PluginRegistry, cfg: ZoomPluginConfig) {
    super(id, registry);

    this.viewport = registry.getPlugin<ViewportPlugin>('viewport')!.provides();
    this.pageMgr  = registry.getPlugin<PageManagerPlugin>('page-manager')!.provides();

    this.minZoom  = cfg.minZoom ?? 0.25;
    this.maxZoom  = cfg.maxZoom ?? 10;
    this.zoomStep = cfg.zoomStep ?? 0.1;
    this.presets  = cfg.presets ?? [];
    this.zoomRanges = this.normalizeRanges(cfg.zoomRanges ?? []);
    /* keep “automatic” modes up to date -------------------------------- */
    this.viewport.onViewportChange (() => this.recalcAuto(), { mode:"debounce", wait:150 });
    this.pageMgr .onPagesChange    (() => this.recalcAuto());
  }

  /* ------------------------------------------------------------------ */
  /* capability                                                          */
  /* ------------------------------------------------------------------ */
  protected buildCapability(): ZoomCapability {
    return {
      onZoomChange : this.zoom$.on,
      zoomIn       : () => {
        const cur = this.getState().currentZoomLevel;
        return this.handleRequest(cur,  this.stepFor(cur));
      },
      zoomOut      : () => {
        const cur = this.getState().currentZoomLevel;
        return this.handleRequest(cur, -this.stepFor(cur));
      },
      requestZoom  : (level, c) => this.handleRequest(level, 0, c),
      requestZoomBy: (d,c)    => {
        const cur = this.getState().currentZoomLevel;
        const target = this.toZoom(cur + d);
        return this.handleRequest(target,0,c);
      },
      getState     : () => this.getState(),
      getPresets   : () => this.presets,
    };
  }

  /* ------------------------------------------------------------------ */
  /* plugin life‑cycle                                                   */
  /* ------------------------------------------------------------------ */
  async initialize(cfg: ZoomPluginConfig): Promise<void> {
    /* apply the initial zoom                                              */
    this.handleRequest(cfg.defaultZoomLevel);
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
    level : ZoomLevel,
    delta : number = 0,
    center?: Point
  ) {
    const state      = this.getState();
    const metrics    = this.viewport.getMetrics();
    const oldZoom    = state.currentZoomLevel;

    /* ------------------------------------------------------------------ */
    /* step 1 – resolve the **target numeric zoom**                        */
    /* ------------------------------------------------------------------ */
    const base =
      typeof level === "number"
        ? level
        : this.computeZoomForMode(level, metrics);

    const newZoom = parseFloat(clamp(base + delta, this.minZoom, this.maxZoom).toFixed(2));

    /* ------------------------------------------------------------------ */
    /* step 2 – figure out the viewport point we should keep under focus   */
    /* ------------------------------------------------------------------ */
    const focus : Point = center ?? {
      vx: metrics.clientWidth  / 2,
      vy: metrics.clientHeight / 2,
    };

    /* ------------------------------------------------------------------ */
    /* step 3 – translate that into desired scroll offsets                 */
    /* ------------------------------------------------------------------ */
    const { desiredScrollLeft, desiredScrollTop } =
      this.computeScrollForZoomChange(metrics, oldZoom, newZoom, focus);

    /* ------------------------------------------------------------------ */
    /* step 4 – dispatch + notify                                          */
    /* ------------------------------------------------------------------ */
    this.dispatch(setZoomLevel(typeof level === "number" ? newZoom : level, newZoom));
    this.dispatchCoreAction(setScale(newZoom));
    this.viewport.scrollTo({
      x: desiredScrollLeft,
      y: desiredScrollTop,
      behavior: 'instant',
    });

    this.pageMgr.updateScale(newZoom);          // let other plugins react

    const evt: ZoomChangeEvent = {
      oldZoom, newZoom, level, center: focus,
      desiredScrollLeft, desiredScrollTop,
      viewport: metrics,
    };

    this.zoom$.emit(evt);
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */

  /** numeric zoom for Automatic / FitPage / FitWidth */
  private computeZoomForMode(mode: ZoomMode, vp: ViewportMetrics): number {
    const spreads   = this.pageMgr.getSpreadPages();
    if (!spreads.length) return 1;

    const pgGap     = this.pageMgr.getPageGap();
    const vpGap     = this.viewport.getViewportGap();

    let maxW = 0, maxH = 0;

    spreads.forEach(spread => {
      const w = spread.reduce((s,p,i)=> s + p.size.width + (i?pgGap:0), 0) + 2*vpGap;
      const h = Math.max(...spread.map(p=>p.size.height))                 + 2*vpGap;
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
    const spreads   = this.pageMgr.getSpreadPages();
    const pgGap     = this.pageMgr.getPageGap();
    const vpGap     = this.viewport.getViewportGap();

    const contentW  = Math.max(...spreads.map(s =>
                        s.reduce((w,p,i)=> w + p.size.width + (i?pgGap:0), 0))) + 2*vpGap;
    const contentH  = Math.max(...spreads.map(s =>
                        Math.max(...s.map(p=>p.size.height))))                 + 2*vpGap;

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
      desiredScrollTop : Math.max(0, desiredScrollTop ),
    };
  }

  /** recalculates Automatic / Fit* when viewport or pages change */
  private recalcAuto() {
    const s = this.getState();
    if (
      s.zoomLevel === ZoomMode.Automatic ||
      s.zoomLevel === ZoomMode.FitPage   ||
      s.zoomLevel === ZoomMode.FitWidth
    ) this.handleRequest(s.zoomLevel);
  }
}
