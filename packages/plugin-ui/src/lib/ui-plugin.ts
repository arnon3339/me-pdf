import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import { GroupedItemsComponent, Header, NavbarPlacement, UICapability, UIComponent, UIPluginConfig } from "./types";

export class UIPlugin extends BasePlugin<UIPluginConfig> {
  private componentRenderers: Record<string, (props: any) => any> = {};
  private config!: { components: Record<string, UIComponent>; headers: Record<string, Header> };
  
  constructor(id: string, registry: PluginRegistry) {
    super(id, registry);
  }

  async initialize(config: UIPluginConfig): Promise<void> {
    this.config = config;
  }

  provides(): UICapability {
    return {
      registerComponentRenderer: (type: string, renderer: (props: any) => any) => this.registerComponentRenderer(type, renderer),
      renderNavbars: () => this.renderNavbars()
    }
  }

  private registerComponentRenderer(type: string, renderer: (props: any) => any): void {
    this.componentRenderers[type] = renderer;
  }

  private renderHeader(headerId: string): any {
    const header = this.config.headers[headerId];
    if (!header) {
      console.warn(`Header ${headerId} not found`);
      return null;
    }
  
    const items = header.items.map(itemId => this.renderComponent(itemId));
    const headerRenderer = this.componentRenderers['header'] || (props => props.items);
    return headerRenderer({ ...header, items });
  }

  private renderComponent(componentId: string): any {
    const component = this.config.components[componentId];
    if (!component) {
      console.warn(`Component ${componentId} not found`);
      return null;
    }
  
    const renderer = this.componentRenderers[component.type];
    if (!renderer) {
      console.warn(`No renderer for type ${component.type}`);
      return null;
    }
  
    if (isGroupedItemsComponent(component)) {
      const props = { ...component };
      props.items = component.items.map(itemId => this.renderComponent(itemId));
      return renderer(props);
    }
  
    return renderer({ ...component });
  }

  private renderNavbars() {
    const navbars: Record<NavbarPlacement, any[]> = { top: [], bottom: [], left: [], right: [] };
    Object.values(this.config.headers).forEach((header) => {
      navbars[header.placement].push(this.renderHeader(header.dataElement));
    });

    const renderedNavbars: Record<NavbarPlacement, any[]> = { top: [], bottom: [], left: [], right: [] };
    Object.entries(navbars).forEach(([placement, headers]) => {
      if (headers.length > 0) {
        renderedNavbars[placement as NavbarPlacement] = headers;
      }
    });

    return renderedNavbars;
  }
}

// Type guard function
function isGroupedItemsComponent(component: UIComponent): component is GroupedItemsComponent {
  return component.type === 'groupedItems';
}