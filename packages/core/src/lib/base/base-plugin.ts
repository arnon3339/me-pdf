import { IPlugin } from '../types/plugin';
import { PluginRegistry } from '../registry/plugin-registry';
import { Action, CoreAction, CoreState, PluginStore, Store } from '../store';

export interface StateChangeHandler<TState> {
  (state: TState): void;
}

export abstract class BasePlugin<
  TConfig = unknown, 
  TCapability = unknown,
  TState = unknown,
  TAction extends Action = Action
> implements IPlugin<TConfig> {
  protected pluginStore: PluginStore<TState, TAction>;
  protected coreStore: Store<CoreState, CoreAction>;
  // Track debounced actions
  private debouncedActions: Record<string, number> = {};
  private unsubscribeFromState: (() => void) | null = null;

  private _capability?: Readonly<TCapability>;

  constructor(
    public readonly id: string,
    protected registry: PluginRegistry
  ) {
    this.coreStore = this.registry.getStore();
    this.pluginStore = this.coreStore.getPluginStore<TState, TAction>(this.id);
    this.unsubscribeFromState = this.pluginStore.subscribeToState((action, newState, oldState) => {
      this.onStoreUpdated(oldState, newState);
    });
  }

  /** Construct the public capability (called once & cached). */
  protected abstract buildCapability(): TCapability;
  
  public provides(): Readonly<TCapability> {
    if (!this._capability) {
      const cap = this.buildCapability();

      this._capability = Object.freeze(cap);
    }
    return this._capability;
  }

  /**
   * Initialize plugin with config
   */
  abstract initialize(config: TConfig): Promise<void>;
  
  /**
   * Get a copy of the current state
   */
  protected getState(): TState {
    return this.pluginStore.getState();
  }

  /**
   * Dispatch an action
   */
  protected dispatch(action: TAction): TState {
    return this.pluginStore.dispatch(action);
  }

  /**
   * Dispatch an action with debouncing to prevent rapid repeated calls
   * @param action The action to dispatch
   * @param debounceTime Time in ms to debounce (default: 100ms)
   * @returns boolean indicating whether the action was dispatched or debounced
   */
  protected debouncedDispatch(action: TAction, debounceTime: number = 100): boolean {
    const now = Date.now();
    const lastActionTime = this.debouncedActions[action.type] || 0;
    
    if (now - lastActionTime >= debounceTime) {
      this.debouncedActions[action.type] = now;
      this.dispatch(action);
      return true;
    }
    
    return false;
  }

  /**
   * Subscribe to state changes
   */
  protected subscribe(listener: (action: TAction, state: TState) => void): () => void {
    return this.pluginStore.subscribeToState(listener);
  }

  /**
   * Called when the plugin store state is updated
   * @param oldState Previous state
   * @param newState New state
   */
  protected onStoreUpdated(oldState: TState, newState: TState): void {
    // Default implementation does nothing - can be overridden by plugins
  }

  /**
   * Cleanup method to be called when plugin is being destroyed
   */
  public destroy(): void {
    if (this.unsubscribeFromState) {
      this.unsubscribeFromState();
      this.unsubscribeFromState = null;
    }
  }
} 