import { useRegistry } from './use-registry.svelte.js';
/**
 * Hook to access a plugin.
 * @param pluginId The ID of the plugin to access
 * @returns The plugin or null during initialization
 * @example
 * // Get zoom plugin
 * const zoom = usePlugin<ZoomPlugin>(ZoomPlugin.id);
 */
export function usePlugin(pluginId) {
    const r = useRegistry();
    if (r.registry === null) {
        return {
            plugin: null,
            isLoading: true,
            ready: new Promise(() => { })
        };
    }
    const plugin = r.registry.getPlugin(pluginId);
    if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
    }
    return {
        plugin,
        isLoading: false,
        ready: plugin.ready()
    };
}
