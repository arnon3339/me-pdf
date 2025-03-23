import { Store } from './store';
import { Action } from './types';

/**
 * A type-safe store handle for plugins, providing access to plugin-specific state and actions.
 */
export class PluginStore<PluginState, PluginAction extends Action> {
  private store: Store<any, any>;
  private pluginId: string;

  /**
   * Initializes the PluginStore with the main store and plugin ID.
   * @param store The main store instance.
   * @param pluginId The unique identifier for the plugin.
   */
  constructor(store: Store<any, any>, pluginId: string) {
    this.store = store;
    this.pluginId = pluginId;
  }

  /**
   * Gets the current state of the plugin.
   * @returns The plugin's state.
   */
  getState(): PluginState {
    return this.store.getState().plugins[this.pluginId] as PluginState;
  }

  /**
   * Dispatches an action for the plugin.
   * @param action The action to dispatch.
   */
  dispatch(action: PluginAction) {
    this.store.dispatchToPlugin(this.pluginId, action);
  }

  /**
   * Subscribes to state changes only for this specific plugin.
   * @param listener The callback to invoke when plugin state changes.
   * @returns A function to unsubscribe the listener.
   */
  subscribeToState(listener: (action: PluginAction, state: PluginState) => void) {
    return this.store.subscribeToPlugin(this.pluginId, (action, state) => {
      listener(action as PluginAction, state as PluginState);
    });
  }

  /**
   * Subscribes to a specific action type for the plugin.
   * @param type The action type to listen for.
   * @param handler The callback to invoke when the action occurs.
   * @returns A function to unsubscribe the handler.
   */
  onAction<T extends PluginAction['type']>(
    type: T,
    handler: (action: Extract<PluginAction, { type: T }>, state: PluginState) => void
  ) {
    return this.store.onAction(type, (action, state) => {
      handler(action as Extract<PluginAction, { type: T }>, state.plugins[this.pluginId] as PluginState);
    });
  }
}