export class UIComponent<T> {
  public props: T;
  public type: string;
  private children: Array<{ component: UIComponent<any>, priority: number }> = [];
  private registry: Record<string, (props: any, children: (ctx?: Record<string, any>) => any[], context?: Record<string, any>) => any>;
  private updateCallbacks: (() => void)[] = [];
  private parent?: UIComponent<any>;
  private hadUpdateBeforeListeners = false;

  constructor(props: T, type: string, registry: Record<string, (props: any, children: (ctx?: Record<string, any>) => any[], context?: Record<string, any>) => any>) {
    this.props = props;
    this.type = type;
    this.registry = registry;
  }

  addChild(child: UIComponent<any>, priority: number = 0) {
    this.children.push({ component: child, priority });
    child.setParent(this);
    // Sort children by priority
    this.sortChildren();
  }

  // Helper to sort children by priority
  private sortChildren() {
    this.children.sort((a, b) => a.priority - b.priority);
  }

  removeChild(child: UIComponent<any>) {
    this.children = this.children.filter(c => c.component !== child);
  }

  clearChildren() {
    // Remove parent reference from all children
    this.children.forEach(({ component }) => {
      component['parent'] = undefined;
    });
    this.children = [];
  }

  private setParent(parent: UIComponent<any>) {
    this.parent = parent;
  }

  // Optionally, a component can provide a function to extend the context for its children.
  // For instance, a header could supply a "direction" based on its position.
  protected getChildContext(context: Record<string, any>): Record<string, any> {
    const childContextProp = (this.props as any).getChildContext;
    if (typeof childContextProp === 'function') {
      // Handle function case (existing behavior)
      return { ...context, ...childContextProp(this.props) };
    } else if (childContextProp && typeof childContextProp === 'object') {
      // Handle object case
      return { ...context, ...childContextProp };
    }
    return context;
  }

  // Updated render method that accepts an optional context.
  render(context?: Record<string, any>): any {
    const renderer = this.registry[this.type];
    if (!renderer) {
      throw new Error(`No renderer registered for type: ${this.type}`);
    }
    const currentContext = this.getChildContext(context || {});
    
    const renderChildrenFn = (ctx?: Record<string, any>) =>
      this.children.map(({ component }) => 
        component.render(ctx ? { ...currentContext, ...ctx } : currentContext)
      );
    
    return renderer(this.props, renderChildrenFn, currentContext);
  }

  update(newProps: Partial<T>) {
    this.props = { ...this.props, ...newProps };
    if (this.updateCallbacks.length === 0) {
      this.hadUpdateBeforeListeners = true;
    }
    this.notifyUpdate();
  }

  onUpdate(callback: () => void) {
    this.updateCallbacks.push(callback);
    return this.hadUpdateBeforeListeners;
  }

  offUpdate(callback: () => void) {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
  }

  protected notifyUpdate() {
    this.updateCallbacks.forEach(cb => cb());
    if (this.parent) {
      this.parent.notifyUpdate(); // Bubble up to parent
    }
  }
}