import { EventEmitter } from './EventEmitter';
import { IPlugin, PluginState } from '../types/plugin';
import { IPDFCore, PDFCoreOptions } from '../types/core';
import { PdfEngine } from '@cloudpdf/models';

export class PDFCore extends EventEmitter implements IPDFCore {
  private plugins: Map<string, IPlugin> = new Map();
  private pluginStates: Map<string, PluginState> = new Map();
  private engine: PdfEngine; // We'll type this properly later

  constructor(options: PDFCoreOptions) {
    super();
    this.engine = options.engine;
    this.engine.initialize?.()
  }

  private async checkRangeSupport(url: string) {
    // First try HEAD request
    const headResponse = await fetch(url, {
        method: 'HEAD'
    });
    
    const fileLength = headResponse.headers.get('Content-Length');
    const acceptRanges = headResponse.headers.get('Accept-Ranges');
    
    // If header explicitly says 'bytes', we know it's supported
    if (acceptRanges === 'bytes') {
        return {
            supportsRanges: true,
            fileLength: parseInt(fileLength ?? '0')
        };
    }

    // If header not present or not 'bytes', do a small range test
    try {
        const testResponse = await fetch(url, {
            headers: {
                'Range': 'bytes=0-1'
            }
        });

        // If we get 206, ranges are supported regardless of Accept-Ranges header
        return {
            supportsRanges: testResponse.status === 206,
            fileLength: parseInt(fileLength ?? '0')
        };
    } catch (error) {
        // If range request fails, assume no range support
        return {
            supportsRanges: false,
            fileLength: parseInt(fileLength ?? '0')
        };
    }
  }

  async loadDocumentByUrl(url: string): Promise<void> {
    const { supportsRanges, fileLength } = await this.checkRangeSupport(url);
    console.log('supportsRanges', supportsRanges);
    console.log('fileLength', fileLength);

    if (supportsRanges) {
      const task = this.engine.openDocumentFromLoader({
        id: Math.random().toString(),
        name: url,
        fileLength,
        callback: (offset: number, length: number) => {
          console.log('offset', offset);
          console.log('length', length);
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, false); // false makes it synchronous
          xhr.overrideMimeType('text/plain; charset=x-user-defined'); // Treat response as binary
          xhr.setRequestHeader('Range', `bytes=${offset}-${offset + length - 1}`);
          xhr.send(null);

          if (xhr.status === 206) {
            // Convert the binary string to Uint8Array
            const text = xhr.responseText;
            const length = text.length;
            const array = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
              array[i] = text.charCodeAt(i) & 0xff;
            }
            return array;
          }
          throw new Error(`Failed to load range: ${xhr.status}`);
        }
      }, '');
      console.log('task', task);
    }
  }

  async loadDocumentByBuffer(buffer: ArrayBuffer): Promise<void> {


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