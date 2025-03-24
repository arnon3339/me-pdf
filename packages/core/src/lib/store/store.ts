import { Reducer, Action, StoreState } from './types';
import { PluginStore } from './plugin-store';


/**
 * A generic, type-safe store class managing core and plugin states, reducers, and subscriptions.
 * @template CoreState The type of the core state.
 * @template CoreAction The type of actions handled by core reducers (extends Action).
 */
export class Store<CoreState, CoreAction extends Action = Action> {
  private state: StoreState<CoreState>;
  private coreReducer: Reducer<CoreState, CoreAction>;
  private pluginReducers: Record<string, Reducer<any, Action>> = {};
  private listeners: ((action: Action, state: StoreState<CoreState>) => void)[] = [];
  private pluginListeners: Record<string, ((action: Action, state: any) => void)[]> = {};

  /**
   * Initializes the store with the provided core state.
   * @param initialCoreState The initial core state.
   */
  constructor( reducer: Reducer<CoreState, CoreAction>, initialCoreState: CoreState) {
    this.state = { core: initialCoreState, plugins: {} };    
    this.coreReducer = reducer;
  }

  /**
   * Adds a reducer for a plugin-specific state.
   * @param pluginId The unique identifier for the plugin.
   * @param reducer The reducer function for the plugin state.
   * @param initialState The initial state for the plugin.
   */
  addPluginReducer<PluginState>(
    pluginId: string,
    reducer: Reducer<PluginState, Action>,
    initialState: PluginState
  ) {
    this.state.plugins[pluginId] = initialState;
    this.pluginReducers[pluginId] = reducer; 
  }

  /**
   * Dispatches an action to update the core state
   * @param action The action to dispatch, typed as CoreAction
   */
  dispatchToCore(action: CoreAction) {
    if (!this.coreReducer) return;

    this.state.core = this.coreReducer(this.state.core, action);
    this.listeners.forEach(listener => listener(action, this.state));
  }

  /**
   * Dispatches an action to a specific plugin.
   * @param pluginId The plugin identifier.
   * @param action The action to dispatch, typed as PluginAction.
   */
  dispatchToPlugin<PluginAction extends Action>(pluginId: string, action: PluginAction, notifyGlobal: boolean = true) {
    const reducer = this.pluginReducers[pluginId];
    if (!reducer) return;

    const newPluginState = reducer(this.state.plugins[pluginId], action);
    this.state.plugins[pluginId] = newPluginState;

    // Notify global listeners
    if (notifyGlobal) {
      this.listeners.forEach(listener => listener(action, this.state));
    }

    // Notify plugin-specific listeners
    if (this.pluginListeners[pluginId]) {
      this.pluginListeners[pluginId].forEach(listener => 
        listener(action, this.state.plugins[pluginId])
      );
    }
  }

  /**
   * Dispatches an action to update the state using all registered reducers.
   * @param action The action to dispatch (can be CoreAction or any Action).
   */
  dispatch(action: CoreAction | Action) {
    // Apply core reducer (only if action is CoreAction)
    if (this.isCoreAction(action)) {
      this.dispatchToCore(action);
    }

    // Apply plugin reducers (for any Action)
    for (const pluginId in this.pluginReducers) {
      this.dispatchToPlugin(pluginId, action, false);
    }
  }

  /**
   * Returns a copy of the current state.
   * @returns The current store state.
   */
  getState(): StoreState<CoreState> {
    return { core: { ...this.state.core }, plugins: { ...this.state.plugins } };
  }

  /**
   * Subscribes a listener to state changes.
   * @param listener The callback to invoke on state changes.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: (action: Action, state: StoreState<CoreState>) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribes a listener to state changes for a specific plugin.
   * @param pluginId The unique identifier for the plugin.
   * @param listener The callback to invoke on plugin state changes.
   * @returns A function to unsubscribe the listener.
   */
  subscribeToPlugin(pluginId: string, listener: (action: Action, state: any) => void) {
    if (!(pluginId in this.state.plugins)) {
      throw new Error(`Plugin state not found for plugin "${pluginId}". Did you forget to call addPluginReducer?`);
    }

    if (!this.pluginListeners[pluginId]) {
      this.pluginListeners[pluginId] = [];
    }
    
    this.pluginListeners[pluginId].push(listener);
    
    return () => {
      this.pluginListeners[pluginId] = this.pluginListeners[pluginId].filter(l => l !== listener);
      if (this.pluginListeners[pluginId].length === 0) {
        delete this.pluginListeners[pluginId];
      }
    };
  }

  /**
   * Subscribes to a specific action type.
   * @param type The action type to listen for.
   * @param handler The callback to invoke when the action occurs.
   * @returns A function to unsubscribe the handler.
   */
  onAction<T extends CoreAction['type']>(
    type: T,
    handler: (action: Extract<CoreAction, { type: T }>, state: StoreState<CoreState>) => void
  ) {
    return this.subscribe((action, state) => {
      if (action.type === type) handler(action as Extract<CoreAction, { type: T }>, state);
    });
  }

  /**
   * Gets a PluginStore handle for a specific plugin (placeholder for completeness).
   * @param pluginId The unique identifier for the plugin.
   * @returns A PluginStore instance for the plugin.
   */
  getPluginStore<PluginState, PluginAction extends Action>(
    pluginId: string
  ): PluginStore<PluginState, PluginAction> {
    if (!(pluginId in this.state.plugins)) {
      throw new Error(`Plugin state not found for plugin "${pluginId}". Did you forget to call addPluginReducer?`);
    }
    return new PluginStore<PluginState, PluginAction>(this, pluginId);
  }

  /**
   * Helper method to check if an action is a CoreAction.
   * @param action The action to check.
   * @returns True if the action is a CoreAction.
   */
  private isCoreAction(action: Action): action is CoreAction {
    return (action as CoreAction).type !== undefined; // Simple check; adjust if needed
  }
}