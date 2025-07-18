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
import { TilingPluginPackage } from '@embedpdf/plugin-tiling';
import { TilingLayer } from '@embedpdf/plugin-tiling/vue';
import { SelectionPluginPackage } from '@embedpdf/plugin-selection';
import { SelectionLayer } from '@embedpdf/plugin-selection/vue';
import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager';
import {
  GlobalPointerProvider,
  PagePointerProvider,
} from '@embedpdf/plugin-interaction-manager/vue';
import { RotatePluginPackage } from '@embedpdf/plugin-rotate';
import { Rotate } from '@embedpdf/plugin-rotate/vue';

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
          createPluginRegistration(TilingPluginPackage, {
            tileSize: 768,
            overlapPx: 2.5,
            extraRings: 0,
          }),
          createPluginRegistration(InteractionManagerPluginPackage),
          createPluginRegistration(SelectionPluginPackage),
          createPluginRegistration(RotatePluginPackage),
        ]"
      >
        <template #default="{ pluginsReady }">
          <GlobalPointerProvider>
            <Viewport v-if="pluginsReady" class="h-full w-full select-none overflow-auto">
              <Scroller>
                <template #default="{ page }">
                  <Rotate :page-size="{ width: page.width, height: page.height }">
                    <PagePointerProvider
                      :page-index="page.pageIndex"
                      :page-width="page.width"
                      :page-height="page.height"
                      :rotation="page.rotation"
                      :scale="page.scale"
                      class="absolute"
                      :style="{
                        width: page.width + 'px',
                        height: page.height + 'px',
                      }"
                    >
                      <RenderLayer
                        :page-index="page.pageIndex"
                        :scale-factor="page.scale"
                        class="pointer-events-none"
                      />
                      <TilingLayer
                        :page-index="page.pageIndex"
                        :scale="page.scale"
                        class="pointer-events-none"
                      />
                      <SelectionLayer :page-index="page.pageIndex" :scale="page.scale" />
                    </PagePointerProvider>
                  </Rotate>
                </template>
              </Scroller>
            </Viewport>
            <div v-else class="flex h-full items-center justify-center">Loading plugins...</div>
          </GlobalPointerProvider>
        </template>
      </EmbedPDF>
    </div>
    <div v-else class="flex h-full items-center justify-center text-gray-500">Engine not ready</div>
  </div>
</template>
