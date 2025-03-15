import { IPlugin, PluginRegistry } from "@embedpdf/core";
import { ViewportCapability, ViewportMetrics, ViewportPluginConfig, WrapperDivOptions } from "./types";
import { EventControl, EventControlOptions } from "./utils/event-control";

export class ViewportPlugin implements IPlugin<ViewportPluginConfig> {
  private container?: HTMLElement;
  private innerDiv?: HTMLElement;
  private wrapperDivs: Map<string, HTMLElement> = new Map();
  private wrapperDivPositions: Map<string, number> = new Map();
  private observer?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private viewportHandlers: ((metrics: ViewportMetrics) => void)[] = [];
  private resizeHandlers: ((metrics: ViewportMetrics) => void)[] = [];
  private containerChangeHandlers: ((element: HTMLElement) => void)[] = [];
  private config!: ViewportPluginConfig;
  private viewportGap: number = 0;

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
      getViewportGap: () => this.viewportGap,
      getInnerDiv: () => {
        if (!this.innerDiv) {
          throw new Error('Inner div not initialized');
        }
        return this.innerDiv;
      },
      addWrapperDiv: (options) => this.addWrapperDiv(options),
      getWrapperDiv: (id) => this.getWrapperDiv(id),
      removeWrapperDiv: (id) => this.removeWrapperDiv(id),
      onViewportChange: (handler, options?: EventControlOptions) => {
        if (options) {
          const controlledHandler = new EventControl(handler, options).handle;
          this.viewportHandlers.push(controlledHandler);
          return controlledHandler;
        }
        this.viewportHandlers.push(handler);
        return handler;
      },
      onResize: (handler, options?: EventControlOptions) => {
        if (options) {
          const controlledHandler = new EventControl(handler, options).handle;
          this.resizeHandlers.push(controlledHandler);
          return controlledHandler;
        }
        this.resizeHandlers.push(handler);
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
    
    // Set viewport gap from config or default to 0
    this.viewportGap = config.viewportGap ?? 0;

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
    container.style.width = `${this.config.defaultWidth ?? 800}px`;
    container.style.height = `${this.config.defaultHeight ?? 600}px`;
    container.style.overflow = 'auto';
    container.style.position = 'relative';
    this.setContainer(container);
  }

  private setupInnerDiv(): void {
    if (!this.container) return;
    
    // Create inner div if it doesn't exist
    if (!this.innerDiv) {
      this.innerDiv = document.createElement('div');
      this.innerDiv.classList.add('pdf-viewport-inner');
      this.innerDiv.style.position = 'relative';
      this.innerDiv.style.width = '100%';
      this.innerDiv.style.height = 'auto';
      this.innerDiv.style.boxSizing = 'border-box';
    }
    
    // Clear container before rebuilding the DOM structure
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    
    // Build DOM structure with wrappers
    this.rebuildDOMStructure();
  }
  
  private rebuildDOMStructure(): void {
    if (!this.container || !this.innerDiv) return;
    
    // Sort wrapper divs by position
    const sortedWrappers = Array.from(this.wrapperDivPositions.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id);
    
    // Start with the innermost element (innerDiv)
    let currentElement = this.innerDiv;
    
    // Wrap the current element with each wrapper, from innermost to outermost
    for (const id of sortedWrappers) {
      const wrapper = this.wrapperDivs.get(id);
      if (wrapper) {
        // Clear wrapper before adding the current element
        while (wrapper.firstChild) {
          wrapper.removeChild(wrapper.firstChild);
        }
        wrapper.appendChild(currentElement);
        currentElement = wrapper;
      }
    }
    
    // Finally, add the outermost element to the container
    this.container.appendChild(currentElement);
  }
  
  public addWrapperDiv(options: WrapperDivOptions): HTMLElement {
    if (!this.container) {
      throw new Error('Container not initialized');
    }
    
    // Check if wrapper with this ID already exists
    if (this.wrapperDivs.has(options.id)) {
      return this.wrapperDivs.get(options.id)!;
    }
    
    // Create new wrapper div
    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = options.id;
    
    // Apply optional class name
    if (options.className) {
      wrapperDiv.className = options.className;
    }
    
    // Apply optional styles
    if (options.styles) {
      Object.assign(wrapperDiv.style, options.styles);
    }
    
    // Set base styles for all wrappers
    wrapperDiv.style.position = 'relative';
    wrapperDiv.style.width = '100%';
    wrapperDiv.style.height = 'auto';
    wrapperDiv.style.boxSizing = 'border-box';
    
    // Store the wrapper and its position
    this.wrapperDivs.set(options.id, wrapperDiv);
    this.wrapperDivPositions.set(options.id, options.position ?? 1000); // Default to high position if not specified
    
    // Rebuild the DOM structure
    this.rebuildDOMStructure();
    
    return wrapperDiv;
  }
  
  public getWrapperDiv(id: string): HTMLElement | null {
    return this.wrapperDivs.get(id) || null;
  }
  
  public removeWrapperDiv(id: string): boolean {
    const wrapper = this.wrapperDivs.get(id);
    if (!wrapper) {
      return false;
    }
    
    this.wrapperDivs.delete(id);
    this.wrapperDivPositions.delete(id);
    
    // Rebuild the DOM structure
    this.rebuildDOMStructure();
    
    return true;
  }

  private setContainer(container: HTMLElement): void {
    // Cleanup old container if exists
    if (this.container && this.observer) {
      this.observer.disconnect();
      this.container.removeEventListener('scroll', this.handleScroll);
      this.mutationObserver?.disconnect();
    }

    this.container = container;
    
    // Apply viewport gap to container padding
    if (this.viewportGap > 0) {
      container.style.padding = `round(down, var(--scale-factor) * ${this.viewportGap}px, 1px)`;
      container.style.boxSizing = 'border-box';
    }

    // Setup inner div
    this.setupInnerDiv();
    
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
      this.notifyResize();
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

  private notifyResize(): void {
    const metrics = this.getViewportMetrics();
    this.resizeHandlers.forEach(handler => handler(metrics));
    // Also notify general viewport change handlers
    this.viewportHandlers.forEach(handler => handler(metrics));
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
    // Clean up handlers and references
    this.viewportHandlers = [];
    this.resizeHandlers = [];
    this.containerChangeHandlers = [];
    this.wrapperDivs.clear();
    this.wrapperDivPositions.clear();
  }
}