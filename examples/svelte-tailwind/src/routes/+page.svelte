<script lang="ts">
  import { usePdfiumEngine } from '@embedpdf/engines/svelte';
  import { createPluginRegistration } from '@embedpdf/core';
  import { EmbedPDF } from '@embedpdf/core/svelte';
  import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
  import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
  import { Viewport } from '@embedpdf/plugin-viewport/svelte';
  import { RenderPluginPackage } from '@embedpdf/plugin-render';
  import MyRenderLayer from '$lib/components/MyRenderLayer.svelte';
  import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/svelte';

  type RenderPageProps = {
    width: number;
    height: number;
    pageIndex: number;
    scale: number;
  };

  const { engine, isLoading } = $derived(usePdfiumEngine());

  const plugins = [
    createPluginRegistration(LoaderPluginPackage, {
      loadingOptions: {
        type: 'url',
        pdfFile: {
          id: 'embed-pdf-doc',
          url: 'https://snippet.embedpdf.com/ebook.pdf',
        },
      },
    }),
    createPluginRegistration(ViewportPluginPackage),
    createPluginRegistration(ScrollPluginPackage),
    createPluginRegistration(RenderPluginPackage),
  ];
</script>

{#snippet RenderPageSnippet({ width, height, pageIndex, scale }: RenderPageProps)}
  <div style:width={`${width}`} style:height={`${height}`} style:position="relative">
    <MyRenderLayer {pageIndex} {scale} />
  </div>
{/snippet}

{#if !engine || isLoading}
  <div>loading...</div>
{:else}
  <div id="pdf-container" class="h-screen">
    <EmbedPDF {engine} logger={undefined} {plugins}>
      <div class="flex h-full flex-col">
        <Viewport class="bg-transparent ">
          <Scroller {RenderPageSnippet} />
        </Viewport>
      </div>
    </EmbedPDF>
  </div>
{/if}
