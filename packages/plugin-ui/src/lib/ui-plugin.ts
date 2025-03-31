import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import { FlyOutComponent, GroupedItemsComponent, HeaderComponent, UICapability, UIPluginConfig } from "./types";
import { UIComponent } from "./ui-component";

export class UIPlugin extends BasePlugin<UIPluginConfig> {
  private componentRenderers: Record<string, (props: any, children: any[], context?: any) => any> = {};
  private components: Record<string, UIComponent<any>> = {};
  private config: UIPluginConfig;

  constructor(id: string, registry: PluginRegistry, config: UIPluginConfig) {
    super(id, registry);
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Step 1: Build all individual components
    this.buildComponents();

    // Step 2: Link children for grouped items
    this.linkGroupedItems();
  }

  private buildComponents() {
    Object.entries(this.config.components).forEach(([id, props]) => {
      this.components[id] = new UIComponent(props, props.type, this.componentRenderers);
    });
  }

  private linkGroupedItems() {
    Object.values(this.components).forEach(component => {
      if (isGroupedItemsComponent(component) || isHeaderComponent(component) || isFlyOutComponent(component)) {
        const props = component.props;
        props.items.forEach(itemId => {
          const child = this.components[itemId];
          if (child) {
            component.addChild(child);
          } else {
            console.warn(`Child component ${itemId} not found for GroupedItems ${props.dataElement}`);
          }
        });
      }
    });
  }

  provides(): UICapability {
    return {
      registerComponentRenderer: (type: string, renderer: (props: any, children: any[], context?: any) => any) => {
        this.componentRenderers[type] = renderer;
      },
      getComponent: <T>(id: string): T | undefined => {
        return this.components[id] as T | undefined;
      },
      getHeadersByPlacement: (placement: 'top' | 'bottom' | 'left' | 'right') => Object.values(this.components).filter(component => isHeaderComponent(component) && component.props.placement === placement),
      getFlyOuts: () => Object.values(this.components).filter(component => isFlyOutComponent(component)),
    };
  }
}

// Type guard function
function isGroupedItemsComponent(component: UIComponent<any>): component is UIComponent<GroupedItemsComponent> {
  return component.type === 'groupedItems';
}

function isHeaderComponent(component: UIComponent<any>): component is UIComponent<HeaderComponent> {
  return component.type === 'header';
}

function isFlyOutComponent(component: UIComponent<any>): component is UIComponent<FlyOutComponent> {
  return component.type === 'flyOut';
}