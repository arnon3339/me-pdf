<script setup lang="ts">
import { usePdfiumEngine } from '@embedpdf/engines/vue';
import { EmbedPDF } from '@embedpdf/core/vue';
import { createPluginRegistration } from '@embedpdf/core';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader/vue';
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/vue';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/vue';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/vue';
import { useSpread, SpreadPluginPackage, SpreadMode } from '@embedpdf/plugin-spread/vue';
import { ZoomMode, ZoomPluginPackage } from '@embedpdf/plugin-zoom/vue';

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
  createPluginRegistration(ZoomPluginPackage, { defaultZoomLevel: ZoomMode.FitPage }),
  createPluginRegistration(SpreadPluginPackage, { defaultSpreadMode: SpreadMode.None }),
];

const { provides: spread, spreadMode } = useSpread();

const modes = [
  { label: 'Single Page', value: SpreadMode.None },
  { label: 'Two-Page (Odd)', value: SpreadMode.Odd },
  { label: 'Two-Page (Even)', value: SpreadMode.Even },
];
</script>

<template>
  <div style="height: 500px">
    <div v-if="isLoading || !engine">Loading PDF Engine...</div>
    <EmbedPDF v-else :engine="engine" :plugins="plugins">
      <div class="flex h-full flex-col">
        <div
          v-if="spread"
          class="mb-4 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
        >
          <span class="text-xs font-medium uppercase tracking-wide text-gray-600">Page Layout</span>
          <div class="h-6 w-px bg-gray-200"></div>
          <div class="flex items-center gap-2">
            <button
              v-for="mode in modes"
              :key="mode.value"
              @click="spread.setSpreadMode(mode.value)"
              :class="[
                'rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150',
                spreadMode === mode.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              ]"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>
        <div class="flex-grow" style="position: relative">
          <Viewport
            style="
              background-color: #f1f3f5;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
            "
          >
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
