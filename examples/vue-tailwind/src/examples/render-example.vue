<script setup lang="ts">
import { ref } from 'vue';
import { usePdfiumEngine } from '@embedpdf/engines/vue';
import { EmbedPDF } from '@embedpdf/core/vue';
import { createPluginRegistration } from '@embedpdf/core';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader/vue';
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/vue';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/vue';
import { RenderLayer, RenderPluginPackage, useRenderCapability } from '@embedpdf/plugin-render/vue';

const { engine, isLoading } = usePdfiumEngine();

const plugins = [
  createPluginRegistration(LoaderPluginPackage, {
    loadingOptions: {
      type: 'url',
      pdfFile: { id: 'example-pdf', url: 'https://snippet.embedpdf.com/ebook.pdf' },
    },
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
];

const { provides: render } = useRenderCapability();
const isExporting = ref(false);

const exportPageAsPng = () => {
  if (!render.value || isExporting.value) return;
  isExporting.value = true;

  const renderTask = render.value.renderPage({
    pageIndex: 0,
    options: { scaleFactor: 2.0, withAnnotations: true, imageType: 'image/png' },
  });

  renderTask.wait(
    (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'page-1.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      isExporting.value = false;
    },
    () => {
      isExporting.value = false;
    },
  );
};
</script>

<template>
  <div style="height: 500px">
    <div v-if="isLoading || !engine">Loading PDF Engine...</div>
    <EmbedPDF v-else :engine="engine" :plugins="plugins">
      <div class="flex h-full flex-col">
        <div
          class="mb-4 mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
        >
          <button
            @click="exportPageAsPng"
            :disabled="!render || isExporting"
            class="rounded-md bg-blue-500 px-3 py-1 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {{ isExporting ? 'Exporting...' : 'Export Page 1 as PNG (2x Res)' }}
          </button>
        </div>
        <div class="relative flex w-full flex-1 overflow-hidden">
          <Viewport class="flex-grow bg-gray-100">
            <Scroller>
              <template #default="{ page }">
                <div
                  :style="{
                    width: page.width + 'px',
                    height: page.height + 'px',
                    position: 'relative',
                  }"
                >
                  <RenderLayer :page-index="page.pageIndex" :scale="page.scale" />
                </div>
              </template>
            </Scroller>
          </Viewport>
        </div>
      </div>
    </EmbedPDF>
  </div>
</template>
