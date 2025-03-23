import { IPlugin } from '../types/plugin';
import { PluginRegistry } from '../registry/plugin-registry';
import { Action, PluginStore } from '../store';

export interface StateChangeHandler<TState> {
  (state: TState): void;
}

export abstract class BasePlugin<TConfig = unknown, TState = unknown, TAction extends Action = Action> implements IPlugin<TConfig> {
  protected pluginStore: PluginStore<TState, TAction>;
  
  constructor(
    public readonly id: string,
    protected registry: PluginRegistry
  ) {
    const store = this.registry.getStore();
    this.pluginStore = store.getPluginStore<TState, TAction>(this.id);
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
   * Subscribe to state changes
   */
  protected dispatch(action: TAction): void {
    this.pluginStore.dispatch(action);
  }

  /**
   * Subscribe to state changes
   */
  protected subscribe(listener: (action: TAction, state: TState) => void): () => void {
    return this.pluginStore.subscribeToState(listener);
  }
} 