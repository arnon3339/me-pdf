import { DependencyResolver } from '../utils/dependency-resolver';
import {
  IPlugin,
  PluginBatchRegistration,
  PluginManifest,
  PluginStatus,
  PluginPackage,
  PluginRegistryConfig
} from '../types/plugin';
import {
  PluginRegistrationError,
  PluginNotFoundError,
  CircularDependencyError,
  CapabilityNotFoundError,
  PluginConfigurationError
} from '../types/errors';
import { PdfEngine, Rotation } from '@embedpdf/models';
import { Action, CoreState, Store, initialCoreState, Reducer } from '../store';
import { CoreAction } from '../store/actions';
import { coreReducer } from '../store/reducer';

// Define a more flexible generic type for plugin registrations
interface PluginRegistration {
  // Use existential types for the plugin package to allow accepting any plugin type
  package: PluginPackage<any, any, any, any>;
  config?: any;
}

export class PluginRegistry {
  private plugins: Map<string, IPlugin> = new Map();
  private manifests: Map<string, PluginManifest> = new Map();
  private capabilities: Map<string, string> = new Map(); // capability -> pluginId
  private status: Map<string, PluginStatus> = new Map();
  private resolver: DependencyResolver;
  private configurations: Map<string, unknown> = new Map();
  private engine: PdfEngine;
  private engineInitialized = false;
  private store: Store<CoreState, CoreAction>;
  
  private pendingRegistrations: PluginRegistration[] = [];
  private processingRegistrations: PluginRegistration[] = [];
  private initialized = false;
  private isInitializing = false;
  private initialCoreState: CoreState;

  constructor(engine: PdfEngine, config?: PluginRegistryConfig) {
    this.resolver = new DependencyResolver();
    this.engine = engine;
    this.initialCoreState = initialCoreState(config);
    this.store = new Store<CoreState, CoreAction>(coreReducer, this.initialCoreState);
  }

  /**
   * Ensure engine is initialized before proceeding
   */
  private async ensureEngineInitialized(): Promise<void> {
    if (this.engineInitialized) {
      return;
    }

    if (this.engine.initialize) {
      const task = this.engine.initialize();
      await new Promise<void>((resolve, reject) => {
        task.wait(
          (success) => {
            if (success) {
              this.engineInitialized = true;
              resolve();
            } else {
              reject(new Error('Engine initialization failed'));
            }
          },
          (error) => reject(new Error(`Engine initialization error: ${error.reason.message}`))
        );
      });
    } else {
      this.engineInitialized = true;
    }
  }

  /**
   * Register a plugin without initializing it
   */
  registerPlugin<
    TPlugin extends IPlugin<TConfig>,
    TConfig = unknown,
    TState = unknown,
    TAction extends Action = Action
  >(
    pluginPackage: PluginPackage<TPlugin, TConfig, TState, TAction>,
    config?: Partial<TConfig>
  ): void {
    if (this.initialized && !this.isInitializing) {
      throw new PluginRegistrationError('Cannot register plugins after initialization');
    }

    this.validateManifest(pluginPackage.manifest);

    // Use appropriate typing for store methods
    this.store.addPluginReducer(
      pluginPackage.manifest.id,
      // We need one type assertion here since we can't fully reconcile TAction with Action
      // due to TypeScript's type system limitations with generic variance
      pluginPackage.reducer as Reducer<TState, Action>,
      'function' === typeof pluginPackage.initialState
        ? (pluginPackage.initialState as (coreState: CoreState, config: TConfig) => TState)(this.initialCoreState, {
          ...pluginPackage.manifest.defaultConfig,
          ...config
        })
        : pluginPackage.initialState
    );

    this.pendingRegistrations.push({
      package: pluginPackage,
      config
    });
  }

  /**
   * Get the central store instance
   */
  getStore(): Store<CoreState, CoreAction> {
    return this.store;
  }

  /**
   * Get the engine instance
   */
  getEngine(): PdfEngine {
    return this.engine;
  }

  /**
   * Initialize all registered plugins in correct dependency order
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('initialize already initialized');
      throw new PluginRegistrationError('Registry is already initialized');
    }

    this.isInitializing = true;

    try {
      // Ensure engine is initialized first
      await this.ensureEngineInitialized();

      // Process registrations until no new ones are added
      while (this.pendingRegistrations.length > 0) {
        // Move current pending registrations to processing
        this.processingRegistrations = [...this.pendingRegistrations];
        this.pendingRegistrations = [];

        console.log('initialize processingRegistrations', this.processingRegistrations);

        // Build dependency graph for current batch
        for (const reg of this.processingRegistrations) {
          const dependsOn = new Set<string>();
          // Consider both required and optional capabilities for load order
          const allDependencies = [...reg.package.manifest.requires, ...reg.package.manifest.optional];
          for (const capability of allDependencies) {
            const provider = this.processingRegistrations.find(r =>
              r.package.manifest.provides.includes(capability)
            );
            if (provider) {
              dependsOn.add(provider.package.manifest.id);
            }
          }
          this.resolver.addNode(reg.package.manifest.id, Array.from(dependsOn));
        }

        // Get load order and initialize current batch
        const loadOrder = this.resolver.resolveLoadOrder();
        for (const pluginId of loadOrder) {
          const registration = this.processingRegistrations.find(
            r => r.package.manifest.id === pluginId
          );
          if (registration) {
            await this.initializePlugin(
              registration.package.manifest,
              registration.package.create,
              registration.config as Partial<unknown>
            );
          }
        }

        // Clear processed registrations
        this.processingRegistrations = [];
        this.resolver = new DependencyResolver();
      }
      
      // Call postInitialize on all plugins after everything is initialized
      for (const plugin of this.plugins.values()) {
        if (plugin.postInitialize) {
          try {
            await plugin.postInitialize();
          } catch (error) {
            console.error(`Error in postInitialize for plugin ${plugin.id}:`, error);
            this.status.set(plugin.id, 'error');
          }
        }
      }

      this.initialized = true;
    } catch (error) {
      if (error instanceof Error) {
        throw new CircularDependencyError(
          `Failed to resolve plugin dependencies: ${error.message}`
        );
      }
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Initialize a single plugin with all necessary checks
   */
  private async initializePlugin<TConfig>(
    manifest: PluginManifest<TConfig>,
    packageCreator: (registry: PluginRegistry, engine: PdfEngine, config?: TConfig) => IPlugin<TConfig>,
    config?: Partial<TConfig>
  ): Promise<void> {
    const finalConfig = {
      ...manifest.defaultConfig,
      ...config
    };

    this.validateConfig(manifest.id, finalConfig, manifest.defaultConfig);

    // Create plugin instance during initialization
    const plugin = packageCreator(this, this.engine, finalConfig);
    this.validatePlugin(plugin);

    // Verify all required capabilities are available
    for (const capability of manifest.requires) {
      if (!this.capabilities.has(capability)) {
        throw new PluginRegistrationError(
          `Missing required capability: ${capability} for plugin ${manifest.id}`
        );
      }
    }

    // Optional capabilities can be null, so we don't throw errors for them
    for (const capability of manifest.optional) {
      if (this.capabilities.has(capability)) {
        // Optional capability is available, but we don't require it
        console.debug(`Optional capability ${capability} is available for plugin ${manifest.id}`);
      }
    }

    console.log('initializePlugin', manifest.id, manifest.provides);

    // Register provided capabilities
    for (const capability of manifest.provides) {
      if (this.capabilities.has(capability)) {
        throw new PluginRegistrationError(
          `Capability ${capability} is already provided by plugin ${this.capabilities.get(capability)}`
        );
      }
      this.capabilities.set(capability, manifest.id);
    }

    // Store plugin and manifest
    this.plugins.set(manifest.id, plugin);
    this.manifests.set(manifest.id, manifest);
    this.status.set(manifest.id, 'registered');
    this.configurations.set(manifest.id, finalConfig);

    try {
      if (plugin.initialize) {
        await plugin.initialize(finalConfig);
      }
      this.status.set(manifest.id, 'active');
    } catch (error) {
      // Cleanup on initialization failure
      this.plugins.delete(manifest.id);
      this.manifests.delete(manifest.id);
      console.log('initializePlugin failed', manifest.id, manifest.provides);
      manifest.provides.forEach(cap => this.capabilities.delete(cap));
      throw error;
    }
  }

  getPluginConfig<TConfig>(pluginId: string): TConfig {
    const config = this.configurations.get(pluginId);
    if (!config) {
      throw new PluginNotFoundError(`Configuration for plugin ${pluginId} not found`);
    }
    return config as TConfig;
  }


  private validateConfig(
    pluginId: string,
    config: unknown,
    defaultConfig: unknown
  ): void {
    // Check all required fields exist
    const requiredKeys = Object.keys(defaultConfig as object);
    const missingKeys = requiredKeys.filter(
      key => !(config as object).hasOwnProperty(key)
    );

    if (missingKeys.length > 0) {
      throw new PluginConfigurationError(
        `Missing required configuration keys for plugin ${pluginId}: ${missingKeys.join(', ')}`
      );
    }

    // You could add more validation here:
    // - Type checking
    // - Value range validation
    // - Format validation
    // etc.
  }

  async updatePluginConfig<TConfig>(
    pluginId: string,
    config: Partial<TConfig>
  ): Promise<void> {
    const plugin = this.getPlugin(pluginId);

    if (!plugin) {
      throw new PluginNotFoundError(`Plugin ${pluginId} not found`);
    }

    const manifest = this.manifests.get(pluginId);
    const currentConfig = this.configurations.get(pluginId);

    if (!manifest || !currentConfig) {
      throw new PluginNotFoundError(`Plugin ${pluginId} not found`);
    }

    // Merge new config with current
    const newConfig = {
      ...currentConfig,
      ...config
    };

    // Validate new configuration
    this.validateConfig(pluginId, newConfig, manifest.defaultConfig);

    // Store new configuration
    this.configurations.set(pluginId, newConfig);

    // Reinitialize plugin if needed
    if (plugin.initialize) {
      await plugin.initialize(newConfig);
    }
  }

  /**
   * Register multiple plugins at once
   */
  registerPluginBatch(registrations: PluginBatchRegistration<IPlugin<any>, any, any, any>[]): void {
    for (const reg of registrations) {
      this.registerPlugin(reg.package, reg.config);
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new PluginNotFoundError(`Plugin ${pluginId} is not registered`);
    }

    const manifest = this.manifests.get(pluginId);
    if (!manifest) {
      throw new PluginNotFoundError(
        `Manifest for plugin ${pluginId} not found`
      );
    }

    // Check if any other plugins depend on this one
    for (const [otherId, otherManifest] of this.manifests.entries()) {
      if (otherId === pluginId) continue;

      const dependsOnThis = [...otherManifest.requires, ...otherManifest.optional].some(cap =>
        manifest.provides.includes(cap)
      );

      if (dependsOnThis) {
        throw new PluginRegistrationError(
          `Cannot unregister plugin ${pluginId}: plugin ${otherId} depends on it`
        );
      }
    }

    // Cleanup plugin
    try {
      if (plugin.destroy) {
        await plugin.destroy();
      }

      // Remove capabilities
      for (const capability of manifest.provides) {
        this.capabilities.delete(capability);
      }

      // Remove plugin and manifest
      this.plugins.delete(pluginId);
      this.manifests.delete(pluginId);
      this.status.delete(pluginId);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to unregister plugin ${pluginId}: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get a plugin instance
   * @param pluginId The ID of the plugin to get
   * @returns The plugin instance or null if not found
   */
  getPlugin<T extends IPlugin>(pluginId: string): T | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return null;
    }
    return plugin as T;
  }

  /**
   * Get a plugin that provides a specific capability
   * @param capability The capability to get a provider for
   * @returns The plugin providing the capability or null if not found
   */
  getCapabilityProvider(capability: string): IPlugin | null {
    const pluginId = this.capabilities.get(capability);
    if (!pluginId) {
      return null;
    }
    return this.getPlugin(pluginId);
  }

  /**
   * Check if a capability is available
   */
  hasCapability(capability: string): boolean {
    return this.capabilities.has(capability);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin status
   */
  getPluginStatus(pluginId: string): PluginStatus {
    const status = this.status.get(pluginId);
    if (!status) {
      throw new PluginNotFoundError(`Plugin ${pluginId} not found`);
    }
    return status;
  }

  /**
   * Validate plugin object
   */
  private validatePlugin(plugin: IPlugin): void {
    if (!plugin.id) {
      throw new PluginRegistrationError('Plugin must have an id');
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id) {
      throw new PluginRegistrationError('Manifest must have an id');
    }
    if (!manifest.name) {
      throw new PluginRegistrationError('Manifest must have a name');
    }
    if (!manifest.version) {
      throw new PluginRegistrationError('Manifest must have a version');
    }
    if (!Array.isArray(manifest.provides)) {
      throw new PluginRegistrationError('Manifest must have a provides array');
    }
    if (!Array.isArray(manifest.requires)) {
      throw new PluginRegistrationError('Manifest must have a requires array');
    }
    if (!Array.isArray(manifest.optional)) {
      throw new PluginRegistrationError('Manifest must have an optional array');
    }
  }
}