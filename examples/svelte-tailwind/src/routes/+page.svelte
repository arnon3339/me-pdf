<script lang="ts">
  import { usePdfiumEngine } from '@embedpdf/engines/svelte';
  import { createPluginRegistration } from '@embedpdf/core';
  import { EmbedPDF } from '@embedpdf/core/svelte';
  import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
  import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
  import { Viewport } from '@embedpdf/plugin-viewport/svelte';
  import { RenderPluginPackage } from '@embedpdf/plugin-render';
  import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/svelte';
  import { useLoaderCapability } from '@embedpdf/plugin-loader/svelte';
  import { RenderLayer } from '@embedpdf/plugin-render/svelte';

  type RenderPageProps = {
    width: number;
    height: number;
    pageIndex: number;
    scale: number;
  };

  const { engine, isLoading } = $derived(usePdfiumEngine());
  const { provides: loaderProvides } = $derived(useLoaderCapability());
  let activeFileLoaded = $state(true);

  const plugins = [
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
    createPluginRegistration(ViewportPluginPackage,  {
        viewportGap: 10,
    }),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage),
  ];

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

{#snippet RenderPageSnippet({ width, height, pageIndex, scale }: RenderPageProps)}
  <div style:width={`${width}`} style:height={`${height}`} style:position="relative">
    {#if activeFileLoaded}
      <RenderLayer {pageIndex} {scale} />
    {/if}
  </div>
{/snippet}

{#if !engine || isLoading}
  <div>loading...</div>
{:else}
  <div id="pdf-container" class="h-screen">
    <EmbedPDF {engine} logger={undefined} {plugins}>
      <div class="flex h-full flex-col">
        <Viewport class="bg-transparent ">
          <input type="file" accept="application/pdf" onchange={handleDocChange} />
          <Scroller {RenderPageSnippet} />
        </Viewport>
      </div>
    </EmbedPDF>
  </div>
{/if}
