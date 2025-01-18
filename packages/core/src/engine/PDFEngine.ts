import { EventEmitter } from './EventEmitter';
import { IPlugin, PluginState } from '../types/plugin';
import { IPDFEngine } from '../types/engine';

export class PDFEngine extends EventEmitter implements IPDFEngine {
  private plugins: Map<string, IPlugin> = new Map();
  private pluginStates: Map<string, PluginState> = new Map();
  
  constructor() {
    super();
  }

  async registerPlugin(plugin: IPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    // Initialize the plugin
    await plugin.initialize(this);
    this.plugins.set(plugin.name, plugin);

    // Set up state management
    this.pluginStates.set(plugin.name, plugin.getState());

    // Listen for state changes
    this.on(`${plugin.name}:stateChange`, (newState: PluginState) => {
      this.pluginStates.set(plugin.name, newState);
    });

    // Emit plugin registered event
    this.emit('plugin:registered', { name: plugin.name });
  }

  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;

    // Clean up plugin
    await plugin.destroy();
    this.plugins.delete(pluginName);
    this.pluginStates.delete(pluginName);

    // Emit plugin unregistered event
    this.emit('plugin:unregistered', { name: pluginName });
  }

  getPlugin<T extends IPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T;
  }

  getPluginState(name: string): PluginState | undefined {
    return this.pluginStates.get(name);
  }

  getAllPlugins(): Map<string, IPlugin> {
    return new Map(this.plugins);
  }
}