<script setup lang="ts">
import { usePdfiumEngine } from '@embedpdf/engines/vue';
import { EmbedPDF } from '@embedpdf/core/vue';
import { createPluginRegistration } from '@embedpdf/core';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { Viewport } from '@embedpdf/plugin-viewport/vue';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { Scroller } from '@embedpdf/plugin-scroll/vue';
import { RenderPluginPackage } from '@embedpdf/plugin-render';
import { RenderLayer } from '@embedpdf/plugin-render/vue';

const { engine, isLoading: engineLoading, error: engineError } = usePdfiumEngine();
</script>

<template>
  <div class="flex h-screen flex-1 flex-col overflow-hidden">
    <div v-if="engineLoading" class="flex h-full items-center justify-center text-gray-500">
      Loading PDF engine...
    </div>
    <div v-else-if="engineError" class="flex h-full items-center justify-center text-red-600">
      Error: {{ engineError.message }}
    </div>
    <div v-else-if="engine" class="flex flex-1 overflow-hidden">
      <EmbedPDF
        :engine="engine"
        :plugins="[
          createPluginRegistration(LoaderPluginPackage, {
            loadingOptions: {
              type: 'url',
              pdfFile: {
                id: 'sample-pdf',
                url: 'https://snippet.embedpdf.com/ebook.pdf', // Replace with your PDF URL
              },
              options: {
                mode: 'full-fetch',
              },
            },
          }),
          createPluginRegistration(ViewportPluginPackage, {
            viewportGap: 10,
          }),
          createPluginRegistration(ScrollPluginPackage, {
            strategy: ScrollStrategy.Vertical,
            pageGap: 10,
          }),
          createPluginRegistration(RenderPluginPackage),
        ]"
      >
        <template #default="{ pluginsReady }">
          <Viewport v-if="pluginsReady" class="h-full w-full select-none overflow-auto">
            <Scroller>
              <template #default="{ page }">
                <RenderLayer :page-index="page.pageIndex" :scale-factor="page.scale" />
              </template>
            </Scroller>
          </Viewport>
          <div v-else class="flex h-full items-center justify-center">Loading plugins...</div>
        </template>
      </EmbedPDF>
    </div>
    <div v-else class="flex h-full items-center justify-center text-gray-500">Engine not ready</div>
  </div>
</template>
