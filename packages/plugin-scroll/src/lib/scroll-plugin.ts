import { BasePlugin, CoreState, PluginRegistry, StoreState, createBehaviorEmitter, createEmitter } from "@embedpdf/core";
import { PdfPageObject } from "@embedpdf/models";
import { ViewportCapability, ViewportMetrics, ViewportPlugin } from "@embedpdf/plugin-viewport";
import { PageManagerCapability, PageManagerPlugin } from "@embedpdf/plugin-page-manager";
import { ScrollCapability, ScrollPluginConfig, ScrollStrategy, ScrollMetrics, ScrollState, LayoutChangePayload, ScrollerLayout } from "./types";
import { BaseScrollStrategy, ScrollStrategyConfig } from "./strategies/base-strategy";
import { VerticalScrollStrategy } from "./strategies/vertical-strategy";
import { HorizontalScrollStrategy } from "./strategies/horizontal-strategy";
import { updateScrollState, setDesiredScrollPosition, ScrollAction } from "./actions";
import { VirtualItem } from "./types/virtual-item";
import { getScrollerLayout } from "./selectors";

export class ScrollPlugin extends BasePlugin<ScrollPluginConfig, ScrollCapability, ScrollState, ScrollAction> {
  private viewport: ViewportCapability;
  private pageManager: PageManagerCapability;
  private strategy: BaseScrollStrategy;
  private strategyConfig: ScrollStrategyConfig;
  private currentScale: number = 1;
  private initialPage?: number;
  private currentPage: number = 1;

  private readonly layout$ = createBehaviorEmitter<LayoutChangePayload>();
  private readonly scroll$ = createBehaviorEmitter<ScrollMetrics>();
  private readonly state$ = createBehaviorEmitter<ScrollState>();
  private readonly scrollerLayout$ = createBehaviorEmitter<ScrollerLayout>();
  private readonly pageChange$  = createEmitter<number>();

  constructor(
    public readonly id: string,
    registry: PluginRegistry,
    private config?: ScrollPluginConfig
  ) {
    super(id, registry);

    this.viewport = this.registry.getPlugin<ViewportPlugin>('viewport')!.provides();
    this.pageManager = this.registry.getPlugin<PageManagerPlugin>('page-manager')!.provides();

    this.strategyConfig = {
      pageGap: this.pageManager.getPageGap() ?? 10,
      viewportGap: this.viewport.getViewportGap(),
      bufferSize: this.config?.bufferSize ?? 2,
    };

    this.strategy = this.config?.strategy === ScrollStrategy.Horizontal
      ? new HorizontalScrollStrategy(this.strategyConfig)
      : new VerticalScrollStrategy(this.strategyConfig);

    this.initialPage = this.config?.initialPage;
    this.currentScale = this.coreStore.getState().core.scale;

    // Subscribe to viewport and page manager events
    this.viewport.onViewportChange(this.handleViewportChange.bind(this), { mode: 'throttle', wait: 250 });
    //this.viewport.onContainerChange(this.handleContainerChange.bind(this));
    this.pageManager.onPagesChange(this.handlePageSpreadChange.bind(this));
    this.pageManager.onPageManagerInitialized(this.handlePageManagerInitialized.bind(this));
  }

  /* viewport listener */
  private handleViewportChange(vp: ViewportMetrics): void {
    this.updateScrollMetrics(vp);
  }

  /* ------------------------------------------------------------------ */
  /* layout recalculated when:                                          */
  /*   ‑ pageManager initialises / changes                              */
  /*   ‑ scale changes                                                  */
  /* ------------------------------------------------------------------ */
  private recalcLayout(pages: PdfPageObject[][]) {
    const virtualItems      = this.strategy.createVirtualItems(pages);
    const totalContentSize  = this.strategy.getTotalContentSize(
                                virtualItems, this.currentScale);
    this.dispatch(updateScrollState({ virtualItems, totalContentSize }));
    this.layout$.emit({ virtualItems, totalContentSize });
  }

  private handlePageManagerInitialized(pages: PdfPageObject[][]) {
    this.recalcLayout(pages);
    this.updateScrollMetrics(this.viewport.getMetrics());
  }

  private handlePageSpreadChange(pages: PdfPageObject[][]) {
    this.recalcLayout(pages);
    this.updateScrollMetrics(this.viewport.getMetrics());
  }

  /* ------------------------------------------------------------------ */
  /* viewport scroll or resize                                          */
  /* ------------------------------------------------------------------ */
  private updateScrollMetrics(vp: ViewportMetrics): ScrollMetrics {
    const s      = this.getState();
    const metr   = this.strategy.handleScroll(
                     vp, s.virtualItems, this.currentScale);
    this.dispatch(updateScrollState(metr));
    this.scroll$.emit(metr);

    if (metr.currentPage !== this.currentPage) {
      this.currentPage = metr.currentPage;
      this.pageChange$.emit(metr.currentPage);
    }
    this.pageManager.updateVisiblePages({
      visiblePages: metr.visiblePages,
      currentPage : metr.currentPage,
      renderedPageIndexes: metr.renderedPageIndexes,
    });

    return metr;
  }

  private getVirtualItemsFromState(): VirtualItem[] {
    const state = this.getState();
    return state.virtualItems || [];
  }

  private getScrollerLayoutFromState(): ScrollerLayout {
    const scale = this.coreStore.getState().core.scale;
    return getScrollerLayout(this.getState(), scale);
  }

  private pushScrollLayout() {
    this.scrollerLayout$.emit(this.getScrollerLayoutFromState());
  }

  override onStoreUpdated(prevState: ScrollState, newState: ScrollState): void {
    this.pushScrollLayout();
  }

  override onCoreStoreUpdated(prevState: StoreState<CoreState>, newState: StoreState<CoreState>): void {
    if(prevState.core.scale !== newState.core.scale) {
      this.currentScale = newState.core.scale;
      this.pushScrollLayout();
      this.updateScrollMetrics(this.viewport.getMetrics());
    }
  }

  /**
   * Change the scroll strategy at runtime (e.g., vertical <-> horizontal)
   * @param newStrategy ScrollStrategy.Horizontal or ScrollStrategy.Vertical
   */
  private setScrollStrategy(newStrategy: ScrollStrategy) {
    // Only update if the strategy is actually changing
    if (
      (newStrategy === ScrollStrategy.Horizontal && this.strategy instanceof HorizontalScrollStrategy) ||
      (newStrategy === ScrollStrategy.Vertical && this.strategy instanceof VerticalScrollStrategy)
    ) {
      return;
    }

    this.strategy =
      newStrategy === ScrollStrategy.Horizontal
        ? new HorizontalScrollStrategy(this.strategyConfig)
        : new VerticalScrollStrategy(this.strategyConfig);

    // Update state with new strategy
    this.dispatch(
      updateScrollState({
        strategy: newStrategy,
      })
    );

    // Recalculate layout and scroll metrics
    const pages = this.pageManager.getSpreadPages();
    this.recalcLayout(pages);
    this.updateScrollMetrics(this.viewport.getMetrics());
  }

  protected buildCapability(): ScrollCapability {
    return {
      onStateChange: this.state$.on,
      onLayoutChange: this.layout$.on,
      onScroll: this.scroll$.on,
      onPageChange: this.pageChange$.on,
      onScrollerData: this.scrollerLayout$.on,
      scrollToPage: (pageNumber, behavior = 'smooth') => {
        const virtualItems = this.getVirtualItemsFromState();
        const position = this.strategy.getScrollPositionForPage(pageNumber, virtualItems, this.currentScale);
        this.viewport.scrollTo({ ...position, behavior });
      },
      scrollToNextPage: (behavior = 'smooth') => {
        const virtualItems = this.getVirtualItemsFromState();
        const currentItemIndex = virtualItems.findIndex(item =>
          item.pageNumbers.includes(this.currentPage)
        );
        if (currentItemIndex >= 0 && currentItemIndex < virtualItems.length - 1) {
          const nextItem = virtualItems[currentItemIndex + 1];
          const position = this.strategy.getScrollPositionForPage(
            nextItem.pageNumbers[0],
            virtualItems,
            this.currentScale
          );
          this.viewport.scrollTo({ ...position, behavior });
        }
      },
      scrollToPreviousPage: (behavior = 'smooth') => {
        const virtualItems = this.getVirtualItemsFromState();
        const currentItemIndex = virtualItems.findIndex(item =>
          item.pageNumbers.includes(this.currentPage)
        );
        if (currentItemIndex > 0) {
          const prevItem = virtualItems[currentItemIndex - 1];
          const position = this.strategy.getScrollPositionForPage(
            prevItem.pageNumbers[0],
            virtualItems,
            this.currentScale
          );
          this.viewport.scrollTo({ ...position, behavior });
        }
      },
      getMetrics: this.getMetrics.bind(this),
      getLayout: this.getLayout.bind(this),
      getState: () => this.getState(),
      getScrollerLayout: () => this.getScrollerLayoutFromState(),
      setScrollStrategy: (strategy: ScrollStrategy) => this.setScrollStrategy(strategy),
    };
  }

  private getMetrics(viewport?: ViewportMetrics): ScrollMetrics {
    const metrics = viewport || this.viewport.getMetrics();
    const virtualItems = this.getVirtualItemsFromState();
    return this.strategy.handleScroll(metrics, virtualItems, this.currentScale);
  }

  private getLayout(): LayoutChangePayload {
    const state = this.getState();
    return { virtualItems: state.virtualItems, totalContentSize: state.totalContentSize };
  }

  async initialize(): Promise<void> {
    // No DOM initialization needed; state drives rendering
  }

  async destroy(): Promise<void> {
    this.layout$.clear();
    this.scroll$.clear();
    this.pageChange$.clear();
    this.state$.clear();
    super.destroy();
  }
}