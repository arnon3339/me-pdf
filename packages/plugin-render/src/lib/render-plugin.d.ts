import { BasePlugin, PluginRegistry, Unsubscribe } from '@embedpdf/core';
import { RenderCapability, RenderPluginConfig } from './types';
export declare class RenderPlugin extends BasePlugin<RenderPluginConfig, RenderCapability> {
    static readonly id: "render";
    private readonly refreshPages$;
    constructor(id: string, registry: PluginRegistry);
    initialize(_config: RenderPluginConfig): Promise<void>;
    protected buildCapability(): RenderCapability;
    onRefreshPages(fn: (pages: number[]) => void): Unsubscribe;
    private renderPage;
    private renderPageRect;
}
