import { IPlugin } from '../plugin-types/plugin';
import { PluginRegistry } from '../registry/plugin-registry';
export interface StateChangeHandler<TState> {
  (state: TState): void;
}

export abstract class BasePlugin<TConfig = unknown, TState = unknown> implements IPlugin<TConfig> {
  protected stateChangeHandlers: StateChangeHandler<TState>[] = [];
  protected state: TState;
  
  constructor(
    public readonly id: string,
    protected registry: PluginRegistry,
    initialState: TState
  ) {
    this.state = initialState;
  }
  
  /**
   * Update plugin state and notify subscribers
   */
  protected updateState(partialState: Partial<TState>): void {
    this.state = {
      ...this.state,
      ...partialState
    };
    
    this.notifyStateChange();
  }
  
  /**
   * Get a copy of the current state
   */
  public getState(): TState {
    return { ...this.state };
  }
  
  /**
   * Subscribe to state changes
   */
  public onStateChange(handler: StateChangeHandler<TState>): () => void {
    this.stateChangeHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeHandlers = this.stateChangeHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Notify all subscribers of state change
   */
  protected notifyStateChange(): void {
    const stateCopy = { ...this.state };
    this.stateChangeHandlers.forEach(handler => handler(stateCopy));
  }
  
  /**
   * Initialize plugin with config
   */
  abstract initialize(config: TConfig): Promise<void>;
  
  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    this.stateChangeHandlers = [];
  }
} 