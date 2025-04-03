import { IPlugin } from '../types/plugin';
import { PluginRegistry } from '../registry/plugin-registry';
import { Action, CoreAction, CoreState, PluginStore, Store } from '../store';

export interface StateChangeHandler<TState> {
  (state: TState): void;
}

export abstract class BasePlugin<TConfig = unknown, TState = unknown, TAction extends Action = Action> implements IPlugin<TConfig> {
  protected pluginStore: PluginStore<TState, TAction>;
  protected coreStore: Store<CoreState, CoreAction>;
  // Track debounced actions
  private debouncedActions: Record<string, number> = {};

  constructor(
    public readonly id: string,
    protected registry: PluginRegistry
  ) {
    this.coreStore = this.registry.getStore();
    this.pluginStore = this.coreStore.getPluginStore<TState, TAction>(this.id);
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
  protected dispatch(action: TAction): void {
    this.pluginStore.dispatch(action);
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
} 