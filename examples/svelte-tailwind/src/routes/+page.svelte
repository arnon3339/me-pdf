<script lang="ts">
    import { usePdfiumEngine } from '@embedpdf/engines/svelte';
    import { createPluginRegistration } from '@embedpdf/core';
    import { EmbedPDF } from '@embedpdf/core/svelte';
    import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
    import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
    import { Viewport } from '@embedpdf/plugin-viewport/svelte';
    import { RenderPluginPackage } from '@embedpdf/plugin-render';
    import MyRenderLayer from '$lib/components/MyRenderLayer.svelte';

    const pdfEngine = usePdfiumEngine();

    const plugins = [
        createPluginRegistration(LoaderPluginPackage, {
            loadingOptions: {
                type: 'url',
                pdfFile: {
                    id: 'embed-pdf-doc',
                    url: 'https://snippet.embedpdf.com/ebook.pdf'
                }
            }
        }),
        createPluginRegistration(ViewportPluginPackage),
        createPluginRegistration(RenderPluginPackage)
    ];

</script>

{#if !pdfEngine.engine || pdfEngine.isLoading}
    <div>loading...</div>
{:else}
    <div id="pdf-container" class="mx-auto w-3/4">
        <EmbedPDF engine={pdfEngine.engine} logger={undefined} {plugins}>
            <div class="flex h-full flex-col">
                <Viewport class="bg-transparent">
                    <MyRenderLayer />
                </Viewport>
            </div>
        </EmbedPDF>
    </div>
{/if}
