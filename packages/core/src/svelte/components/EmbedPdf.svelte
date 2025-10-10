<script lang="ts">
    import type {Logger, PdfEngine} from '@embedpdf/models';
    import {type IPlugin, type PluginBatchRegistration, PluginRegistry} from '@embedpdf/core';
    import {type Snippet} from 'svelte';
    import AutoMount from "./AutoMount.svelte";
    import { type PDFContextState, setPDFContext } from "../context";


    interface EmbedPDFProps {
    /**
     * The PDF engine to use for the PDF viewer.
     */
    engine: PdfEngine;
    /**
     * The logger to use for the PDF viewer.
     */
    logger?: Logger;
    /**
     * The callback to call when the PDF viewer is initialized.
     */
    onInitialized?: (registry: PluginRegistry) => Promise<void>;
    /**
     * The plugins to use for the PDF viewer.
     */
    plugins: PluginBatchRegistration<IPlugin<any>, any>[];
    /**
     * The children to render for the PDF viewer.
     */
    children: Snippet<[PDFContextState]>;
    /**
     * Whether to auto-mount specific non-visual DOM elements from plugins.
     * @default true
     */
    autoMountDomElements?: boolean;
  }

  let {
    engine,
    logger,
    onInitialized,
    plugins,
    children,
    autoMountDomElements = true
  }: EmbedPDFProps = $props();

  const ctx = $state<PDFContextState>({
    registry: null,
    isInitializing: true,
    pluginsReady: false
  });

  let latestInit = onInitialized;
  setPDFContext(ctx);

  $effect(() => {
    if (onInitialized) {
      latestInit = onInitialized;
    }
  });

  $effect(() => {
    if (engine || (engine && plugins)) {
      const reg = new PluginRegistry(engine, { logger });
      reg.registerPluginBatch(plugins);

      const initialize = async () => {
        await reg.initialize();

        // if the registry is destroyed, don't do anything
        if (reg.isDestroyed()) {
          return;
        }

        /* always call the *latest* callback */
        await latestInit?.(reg);

        // if the registry is destroyed, don't do anything
        if (reg.isDestroyed()) {
          return;
        }

        reg.pluginsReady().then(() => {
          if (!reg.isDestroyed()) {
            ctx.pluginsReady = true;
          }
        });

        // Provide the registry to children via context
        ctx.registry = reg;
        ctx.isInitializing = false;
      };
      initialize().catch(console.error);

      return () => {
        reg.destroy();
        ctx.registry = null;
        ctx.isInitializing = false;
        ctx.pluginsReady = false;
      };
    }
  });
</script>

{#if ctx.pluginsReady && autoMountDomElements}
  <AutoMount {plugins}>{@render children(ctx)}</AutoMount>
{:else}
  {@render children(ctx)}
{/if}
