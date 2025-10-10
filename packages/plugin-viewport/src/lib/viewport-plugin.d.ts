import { BasePlugin, PluginRegistry, Listener } from '@embedpdf/core';
import { ViewportAction } from './actions';
import { ViewportPluginConfig, ViewportState, ViewportCapability, ViewportScrollMetrics, ViewportInputMetrics, ScrollToPayload } from './types';
import { Rect } from '@embedpdf/models';
export declare class ViewportPlugin extends BasePlugin<ViewportPluginConfig, ViewportCapability, ViewportState, ViewportAction> {
    readonly id: string;
    static readonly id: "viewport";
    private readonly viewportResize$;
    private readonly viewportMetrics$;
    private readonly scrollMetrics$;
    private readonly scrollReq$;
    private readonly scrollActivity$;
    private rectProvider;
    private readonly scrollEndDelay;
    constructor(id: string, registry: PluginRegistry, config: ViewportPluginConfig);
    protected buildCapability(): ViewportCapability;
    setViewportResizeMetrics(viewportMetrics: ViewportInputMetrics): void;
    setViewportScrollMetrics(scrollMetrics: ViewportScrollMetrics): void;
    onScrollRequest(listener: Listener<ScrollToPayload>): import("@embedpdf/core").Unsubscribe;
    registerBoundingRectProvider(provider: (() => Rect) | null): void;
    private bumpScrollActivity;
    private scrollTo;
    private emitScrollActivity;
    onStoreUpdated(prevState: ViewportState, newState: ViewportState): void;
    initialize(_config: ViewportPluginConfig): Promise<void>;
    destroy(): Promise<void>;
}
