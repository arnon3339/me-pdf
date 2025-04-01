import { BasePlugin, PluginRegistry } from "@embedpdf/core";
import { ActionTabsComponent, FlyOutComponent, GroupedItemsComponent, HeaderComponent, UICapability, UIComponentCollection, UIPluginConfig } from "./types";
import { UIComponent } from "./ui-component";

export class UIPlugin extends BasePlugin<UIPluginConfig> {
  private componentRenderers: Record<string, (props: any, children: (ctx?: Record<string, any>) => any[], context?: Record<string, any>) => any> = {};
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
      if (isItemWithSlots(component)) {
        const props = component.props;
        props.slots.forEach(slot => {
          const child = this.components[slot.componentId];
          if (child) {
            component.addChild(child, slot.priority);
          } else {
            console.warn(`Child component ${slot.componentId} not found for GroupedItems ${props.id}`);
          }
        });
      }
    });
  }

  private addSlot(parentId: string, slotId: string, priority?: number) {
    // 1. Get the parent component
    const parentComponent = this.components[parentId];
    
    if (!parentComponent) {
      console.error(`Parent component ${parentId} not found`);
      return;
    }
    
    // 2. Check if parent has slots (is a container type)
    if (!isItemWithSlots(parentComponent)) {
      console.error(`Parent component ${parentId} does not support slots`);
      return;
    }
    
    // 3. Get the component to add to the slot
    const childComponent = this.components[slotId];
    
    if (!childComponent) {
      console.error(`Child component ${slotId} not found`);
      return;
    }
    
    const parentProps = parentComponent.props;
    
    // 4. Determine priority for the new slot
    let slotPriority = priority;
    
    if (slotPriority === undefined) {
      // If no priority is specified, add it at the end with a reasonable gap
      const existingSlots = parentProps.slots || [];
      const maxPriority = existingSlots.length > 0 
        ? Math.max(...existingSlots.map(slot => slot.priority)) 
        : 0;
      slotPriority = maxPriority + 10; // Add a gap of 10
    }
    
    // 5. Check if slot already exists in the props
    const existingSlotIndex = (parentProps.slots || []).findIndex(slot => slot.componentId === slotId);
    
    if (existingSlotIndex >= 0) {
      // Update existing slot priority in the props
      parentProps.slots[existingSlotIndex].priority = slotPriority;
    } else {
      // Add the slot to the parent's slots array in the props
      parentProps.slots = [
        ...(parentProps.slots || []),
        { componentId: slotId, priority: slotPriority }
      ];
    }
    
    // 6. Add the child to the parent component with the appropriate priority
    // The UIComponent will handle sorting and avoid duplicates
    parentComponent.addChild(childComponent, slotPriority);
    
    // 7. Notify that the parent component was updated
    parentComponent.update(parentProps as any);
  }

  provides(): UICapability {
    return {
      registerComponentRenderer: (type: string, renderer: (props: any, children: (ctx?: Record<string, any>) => any[], context?: Record<string, any>) => any) => {
        this.componentRenderers[type] = renderer;
      },
      getComponent: <T>(id: string): T | undefined => {
        return this.components[id] as T | undefined;
      },
      registerComponent: (componentId: string, componentProps: UIComponentCollection) => {
        if (this.components[componentId]) {
          console.warn(`Component with ID ${componentId} already exists and will be overwritten`);
        }
        
        const component = new UIComponent(componentProps, componentProps.type, this.componentRenderers);
        this.components[componentId] = component;
        
        return component;
      },
      getHeadersByPlacement: (placement: 'top' | 'bottom' | 'left' | 'right') => Object.values(this.components).filter(component => isHeaderComponent(component) && component.props.placement === placement),
      getFlyOuts: () => Object.values(this.components).filter(component => isFlyOutComponent(component)),
      addSlot: this.addSlot.bind(this)
    };
  }
}

function isItemWithSlots(component: UIComponent<any>): component is UIComponent<GroupedItemsComponent> | UIComponent<HeaderComponent> | UIComponent<FlyOutComponent> {
  return isGroupedItemsComponent(component) || isHeaderComponent(component) || isFlyOutComponent(component);
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