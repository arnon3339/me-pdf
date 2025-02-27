import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { ViewportCapability, ViewportMetrics, ViewportPluginConfig } from "./types";
import { ScrollControl, ScrollControlOptions } from "./utils/scroll-control";

export class ViewportPlugin implements IPlugin<ViewportPluginConfig> {
  private container?: HTMLElement;
  private observer?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private viewportHandlers: ((metrics: ViewportMetrics) => void)[] = [];
  private containerChangeHandlers: ((element: HTMLElement) => void)[] = [];
  private config!: ViewportPluginConfig;

  constructor(
    public readonly id: string,
    private registry: PluginRegistry,
  ) {}

  provides(): ViewportCapability {
    return {
      getContainer: () => {
        if (!this.container) {
          throw new Error('Viewport container not initialized');
        }
        return this.container;
      },
      getMetrics: () => this.getViewportMetrics(),
      setContainer: (container) => this.setContainer(container),
      onViewportChange: (handler, options?: ScrollControlOptions) => {
        if (options) {
          const controlledHandler = new ScrollControl(handler, options).handle;
          this.viewportHandlers.push(controlledHandler);
          return controlledHandler;
        }
        this.viewportHandlers.push(handler);
        return handler;
      },
      onContainerChange: (handler) => {
        this.containerChangeHandlers.push(handler);
        return handler;
      }
    };
  }

  async initialize(config: ViewportPluginConfig): Promise<void> {
    this.config = config;

    // If container is provided in config, use it
    if (config.container) {
      this.setContainer(config.container);
    } else {
      // Create default container
      this.createDefaultContainer();
    }
  }

  private createDefaultContainer(): void {
    const container = document.createElement('div');
    container.style.width = `${this.config.defaultWidth}px`;
    container.style.height = `${this.config.defaultHeight}px`;
    container.style.overflow = 'auto';
    container.style.position = 'relative';
    this.setContainer(container);
  }

  private setContainer(container: HTMLElement): void {
    // Cleanup old container if exists
    if (this.container && this.observer) {
      this.observer.disconnect();
      this.container.removeEventListener('scroll', this.handleScroll);
      this.mutationObserver?.disconnect();
    }

    this.container = container;

    // Setup new container
    this.setupContainerObserver();
    this.setupMutationObserver();
    this.container.addEventListener('scroll', this.handleScroll);
    
    // Notify initial metrics
    this.notifyViewportChange();
    
    // Notify container change handlers
    this.notifyContainerChange();
  }

  private setupContainerObserver(): void {
    this.observer = new ResizeObserver(() => {
      this.notifyViewportChange();
    });

    if (this.container) {
      this.observer.observe(this.container);
    }
  }

  private setupMutationObserver(): void {
    // Disconnect existing observer if any
    this.mutationObserver?.disconnect();
    
    if (!this.container) return;
    
    const config = {
      attributes: true,
      attributeFilter: ['style', 'class']
    };
    
    this.mutationObserver = new MutationObserver(() => {
      this.notifyContainerChange();
    });

    this.mutationObserver.observe(this.container, config);
  }

  private handleScroll = (): void => {
    this.notifyViewportChange();
  };

  private getViewportMetrics(): ViewportMetrics {
    if (!this.container) {
      throw new Error('Viewport container not initialized');
    }

    return {
      width: this.container.offsetWidth,
      height: this.container.offsetHeight,
      scrollTop: this.container.scrollTop,
      scrollLeft: this.container.scrollLeft,
      clientWidth: this.container.clientWidth,
      clientHeight: this.container.clientHeight,
      scrollWidth: this.container.scrollWidth,
      scrollHeight: this.container.scrollHeight,
      relativePosition: {
        x: this.container.scrollWidth <= this.container.clientWidth ? 0 : this.container.scrollLeft / (this.container.scrollWidth - this.container.clientWidth),
        y: this.container.scrollHeight <= this.container.clientHeight ? 0 : this.container.scrollTop / (this.container.scrollHeight - this.container.clientHeight)
      }
    };
  }

  private notifyViewportChange(): void {
    const metrics = this.getViewportMetrics();
    this.viewportHandlers.forEach(handler => handler(metrics));
  }

  private notifyContainerChange(): void {
    if (!this.container) return;
    
    this.containerChangeHandlers.forEach(handler => handler(this.container!));
    
    // Also notify viewport change since container properties might affect metrics
    this.notifyViewportChange();
  }

  async destroy(): Promise<void> {
    if (this.container && this.observer) {
      this.observer.disconnect();
      this.mutationObserver?.disconnect();
      this.container.removeEventListener('scroll', this.handleScroll);
    }
    // Clean up handlers
    this.viewportHandlers = [];
    this.containerChangeHandlers = [];
  }
}