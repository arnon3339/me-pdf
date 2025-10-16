<script lang="ts">
  import { usePdfiumEngine } from '@embedpdf/engines/svelte';
  import {
    createPluginRegistration,
    type IPlugin,
    type PluginBatchRegistration,
  } from '@embedpdf/core';
  import { EmbedPDF } from '@embedpdf/core/svelte';
  import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
  import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
  import { Viewport } from '@embedpdf/plugin-viewport/svelte';
  import { RenderPluginPackage } from '@embedpdf/plugin-render';
  import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/svelte';
  import { useLoaderCapability } from '@embedpdf/plugin-loader/svelte';
  import { RenderLayer } from '@embedpdf/plugin-render/svelte';
  import { MarqueeZoom, ZoomMode, ZoomPluginPackage } from '@embedpdf/plugin-zoom/svelte';
  import {
    InteractionManagerPluginPackage,
    PagePointerProvider,
  } from '@embedpdf/plugin-interaction-manager/svelte';
  import ZoomToolbar from '$lib/components/ZoomToolbar.svelte';
  import type { Rotation } from '@embedpdf/models';

  type RenderPageProps = {
    width: number;
    height: number;
    pageIndex: number;
    scale: number;
    rotation: Rotation;
  };

  type PageProps = {
    withMarqueeZoom?: boolean;
  };
  let { withMarqueeZoom = false }: PageProps = $props();

  const { engine, isLoading } = $derived(usePdfiumEngine());
  const { provides: loaderProvides } = $derived(useLoaderCapability());
  let activeFileLoaded = $state(true);

  let plugins = $derived.by(() => {
    const basePlugins: PluginBatchRegistration<IPlugin<any>, any>[] = [
      createPluginRegistration(LoaderPluginPackage, {
        loadingOptions: {
          type: 'url',
          pdfFile: {
            id: '1',
            url: 'https://snippet.embedpdf.com/ebook.pdf',
          },
          options: {
            mode: 'full-fetch',
          },
        },
      }),
      createPluginRegistration(ViewportPluginPackage, {
        viewportGap: 10,
      }),
      createPluginRegistration(ScrollPluginPackage),
      createPluginRegistration(RenderPluginPackage),
      createPluginRegistration(ZoomPluginPackage, {
        defaultZoomLevel: ZoomMode.FitPage,
      }),
    ];
    if (withMarqueeZoom) {
      basePlugins.push(createPluginRegistration(InteractionManagerPluginPackage));
    }
    return basePlugins;
  });

  async function handleDocChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
  ) {
    activeFileLoaded = false;
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file && loaderProvides) {
      const arrayBuffer = await file.arrayBuffer();
      await loaderProvides.loadDocument({
        type: 'buffer',
        pdfFile: {
          id: Math.random().toString(36).substring(2, 15),
          name: file.name,
          content: arrayBuffer,
        },
      });
      activeFileLoaded = true;
    }
  }
</script>

{#snippet RenderLayers({  pageIndex, scale}: RenderPageProps)}
  <RenderLayer {pageIndex} {scale} />
  {#if withMarqueeZoom}
    <MarqueeZoom {pageIndex} {scale} />
  {/if}
{/snippet}

{#snippet RenderPageSnippet(props: RenderPageProps)}
  <div style:width={`${props.width}`} style:height={`${props.height}`} style:position="relative">
    {#if activeFileLoaded}
      {#if withMarqueeZoom}
        <PagePointerProvider
          pageIndex={props.pageIndex}
          pageWidth={props.width}
          pageHeight={props.height}
          rotation={props.rotation}
          scale={props.scale}
        >
          {@render RenderLayers(props)}
        </PagePointerProvider>
      {:else}
        {@render RenderLayers(props)}
      {/if}
      <RenderLayer pageIndex={props.pageIndex} scale={props.scale} />
      {#if withMarqueeZoom}
        <MarqueeZoom pageIndex={props.pageIndex} scale={props.scale} />
      {/if}
    {/if}
  </div>
{/snippet}

{#if !engine || isLoading}
  <div>loading...</div>
{:else}
  <div id="pdf-container" class="h-screen">
    <EmbedPDF {engine} logger={undefined} {plugins}>
      <div class="flex h-full flex-col">
        <ZoomToolbar {withMarqueeZoom} />
        <Viewport class="bg-transparent ">
          <input type="file" accept="application/pdf" onchange={handleDocChange} />
          <Scroller {RenderPageSnippet} />
        </Viewport>
      </div>
    </EmbedPDF>
  </div>
{/if}
