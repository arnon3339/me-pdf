import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { ViewportCapability, ViewportMetrics, ViewportPluginConfig } from "./types";
import { ScrollControl, ScrollControlOptions } from "./utils/scroll-control";

export class ViewportPlugin implements IPlugin<ViewportPluginConfig> {
  private container?: HTMLElement;
  private observer?: ResizeObserver;
  private viewportHandlers: ((metrics: ViewportMetrics) => void)[] = [];
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
    }

    this.container = container;

    // Setup new container
    this.setupContainerObserver();
    this.container.addEventListener('scroll', this.handleScroll);
    
    // Notify initial metrics
    this.notifyViewportChange();
  }

  private setupContainerObserver(): void {
    this.observer = new ResizeObserver(() => {
      this.notifyViewportChange();
    });

    if (this.container) {
      this.observer.observe(this.container);
    }
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

  async destroy(): Promise<void> {
    if (this.container && this.observer) {
      this.observer.disconnect();
      this.container.removeEventListener('scroll', this.handleScroll);
    }
    // Clean up any controlled handlers
    this.viewportHandlers = [];
  }
}