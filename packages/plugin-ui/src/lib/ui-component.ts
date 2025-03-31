export class UIComponent<T> {
  public props: T;
  public type: string;
  private children: UIComponent<any>[] = [];
  private registry: Record<string, (props: any, children: any[], context?: any) => any>;
  private updateCallbacks: (() => void)[] = [];
  private parent?: UIComponent<any>;
  private hadUpdateBeforeListeners = false;

  constructor(props: T, type: string, registry: Record<string, (props: any, children: any[], context?: any) => any>) {
    this.props = props;
    this.type = type;
    this.registry = registry;
  }

  addChild(child: UIComponent<any>) {
    this.children.push(child);
    child.setParent(this);
  }

  private setParent(parent: UIComponent<any>) {
    this.parent = parent;
  }

  // Optionally, a component can provide a function to extend the context for its children.
  // For instance, a header could supply a "direction" based on its position.
  protected getChildContext(context: any): any {
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
  render(context?: any): any {
    const renderer = this.registry[this.type];
    if (!renderer) {
      throw new Error(`No renderer registered for type: ${this.type}`);
    }
    // Merge or extend context if the component provides additional context.
    const currentContext = this.getChildContext(context || {});
    // Pass the current context to all child renders.
    const renderedChildren = this.children.map(child => child.render(currentContext));
    return renderer(this.props, renderedChildren, currentContext);
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