export class UIComponent<T> {
  public props: T;
  public type: string;
  private children: UIComponent<any>[] = [];
  private registry: Record<string, (props: any, children: any[]) => any>;
  private updateCallbacks: (() => void)[] = [];
  private parent?: UIComponent<any>;
  private hadUpdateBeforeListeners = false;

  constructor(props: T, type: string, registry: Record<string, (props: any, children: any[]) => any>) {
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

  render(): any {
    const renderer = this.registry[this.type];
    if (!renderer) {
      throw new Error(`No renderer registered for type: ${this.type}`);
    }
    const renderedChildren = this.children.map(child => child.render());
    return renderer(this.props, renderedChildren);
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