<script lang="ts">
  import { usePdfiumEngine } from '@embedpdf/engines/svelte';
  import {
    createPluginRegistration,
    type IPlugin,
    type PluginBatchRegistration,
  } from '@embedpdf/core';
  import type { Rotation } from '@embedpdf/models';
  import { EmbedPDF } from '@embedpdf/core/svelte';
  import { LoaderPluginPackage } from '@embedpdf/plugin-loader/svelte';
  import { ViewportPluginPackage } from '@embedpdf/plugin-viewport/svelte';
  import { Viewport } from '@embedpdf/plugin-viewport/svelte';
  import { RenderPluginPackage } from '@embedpdf/plugin-render/svelte';
  import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/svelte';
  import { RenderLayer } from '@embedpdf/plugin-render/svelte';
  import { MarqueeZoom } from '@embedpdf/plugin-zoom/svelte';
  import { ZoomPluginPackage } from '@embedpdf/plugin-zoom/svelte';
  import {
    InteractionManagerPluginPackage,
    PagePointerProvider,
  } from '@embedpdf/plugin-interaction-manager/svelte';
  import { TilingPluginPackage, TilingLayer } from '@embedpdf/plugin-tiling/svelte';
  import { SelectionPluginPackage, SelectionLayer } from '@embedpdf/plugin-selection/svelte';
  import { PrintPluginPackage } from '@embedpdf/plugin-print/svelte';
  import { SpreadPluginPackage } from '@embedpdf/plugin-spread/svelte';
  import ZoomToolbar from '$lib/components/ZoomToolbar.svelte';

  type RenderPageProps = {
    width: number;
    height: number;
    pageIndex: number;
    scale: number;
    rotation: Rotation;
  };

  const { engine, isLoading } = $derived(usePdfiumEngine());

  let plugins = $derived.by(() => {
    const basePlugins: PluginBatchRegistration<IPlugin<any>, any>[] = [
      createPluginRegistration(LoaderPluginPackage, {
        loadingOptions: {
          type: 'url',
          pdfFile: {
            id: '1',
            url: 'https://snippet.embedpdf.com/ebook.pdf',
          },
        },
      }),
      createPluginRegistration(ViewportPluginPackage),
      createPluginRegistration(ScrollPluginPackage),
      createPluginRegistration(RenderPluginPackage),
      createPluginRegistration(TilingPluginPackage),
      createPluginRegistration(ZoomPluginPackage),
      createPluginRegistration(SelectionPluginPackage),
      createPluginRegistration(InteractionManagerPluginPackage),
      createPluginRegistration(PrintPluginPackage),
      createPluginRegistration(SpreadPluginPackage),
    ];
    return basePlugins;
  });
</script>

{#snippet RenderLayers({ pageIndex, scale }: RenderPageProps)}
  <RenderLayer {pageIndex} scale={1} />
  <TilingLayer {pageIndex} {scale} />
  <SelectionLayer {pageIndex} {scale} />
  <MarqueeZoom {pageIndex} {scale} />
{/snippet}

{#snippet RenderPageSnippet(props: RenderPageProps)}
  <div style:width={`${props.width}`} style:height={`${props.height}`} style:position="relative">
    <PagePointerProvider
      pageIndex={props.pageIndex}
      pageWidth={props.width}
      pageHeight={props.height}
      rotation={props.rotation}
      scale={props.scale}
    >
      {@render RenderLayers(props)}
    </PagePointerProvider>
  </div>
{/snippet}

{#if !engine || isLoading}
  <div>loading...</div>
{:else}
  <div id="view-page" class="flex h-screen flex-1 flex-col overflow-hidden">
    <EmbedPDF {engine} logger={undefined} {plugins}>
      <div class="flex h-full flex-col">
        <ZoomToolbar />
        <Viewport class="h-full w-full flex-1 overflow-auto select-none bg-gray-100">
          <Scroller {RenderPageSnippet} />
        </Viewport>
      </div>
    </EmbedPDF>
  </div>
{/if}
