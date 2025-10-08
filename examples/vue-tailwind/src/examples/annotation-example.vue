<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { usePdfiumEngine } from '@embedpdf/engines/vue';
import { EmbedPDF } from '@embedpdf/core/vue';
import { createPluginRegistration } from '@embedpdf/core';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader/vue';
import { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/vue';
import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/vue';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/vue';
import {
  AnnotationLayer,
  AnnotationPluginPackage,
  AnnotationPlugin,
  AnnotationTool,
  useAnnotationCapability,
} from '@embedpdf/plugin-annotation/vue';
import {
  InteractionManagerPluginPackage,
  PagePointerProvider,
} from '@embedpdf/plugin-interaction-manager/vue';
import { SelectionLayer, SelectionPluginPackage } from '@embedpdf/plugin-selection/vue';
import { HistoryPluginPackage } from '@embedpdf/plugin-history/vue';
import { PdfAnnotationSubtype, PdfStampAnnoObject } from '@embedpdf/models';
import type { PluginRegistry } from '@embedpdf/core';

const { engine, isLoading } = usePdfiumEngine();

const plugins = [
  createPluginRegistration(LoaderPluginPackage, {
    loadingOptions: {
      type: 'url',
      pdfFile: {
        id: 'example-pdf',
        url: 'https://snippet.embedpdf.com/ebook.pdf',
      },
    },
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
  createPluginRegistration(InteractionManagerPluginPackage),
  createPluginRegistration(SelectionPluginPackage),
  createPluginRegistration(HistoryPluginPackage),
  createPluginRegistration(AnnotationPluginPackage, {
    annotationAuthor: 'EmbedPDF User',
  }),
];

const activeTool = ref<string | null>(null);
const canDelete = ref(false);

const { provides: annotationApi } = useAnnotationCapability();

const tools = [
  { id: 'stampCheckmark', name: 'Checkmark (stamp)' },
  { id: 'stampCross', name: 'Cross (stamp)' },
  { id: 'ink', name: 'Pen' },
  { id: 'square', name: 'Square' },
  { id: 'highlight', name: 'Highlight' },
];

let unsubscribeToolChange: (() => void) | undefined;
let unsubscribeStateChange: (() => void) | undefined;

onMounted(() => {
  if (!annotationApi.value) return;

  unsubscribeToolChange = annotationApi.value.onActiveToolChange((tool) => {
    activeTool.value = tool?.id ?? null;
  });

  unsubscribeStateChange = annotationApi.value.onStateChange((state) => {
    canDelete.value = !!state.selectedUid;
  });
});

onUnmounted(() => {
  unsubscribeToolChange?.();
  unsubscribeStateChange?.();
});

const handleToolClick = (toolId: string) => {
  annotationApi.value?.setActiveTool(activeTool.value === toolId ? null : toolId);
};

const handleDelete = () => {
  const selection = annotationApi.value?.getSelectedAnnotation();
  if (selection) {
    annotationApi.value?.deleteAnnotation(selection.object.pageIndex, selection.object.id);
  }
};

const handleInitialized = async (registry: PluginRegistry) => {
  const annotation = registry.getPlugin<AnnotationPlugin>('annotation')?.provides();

  annotation?.addTool<AnnotationTool<PdfStampAnnoObject>>({
    id: 'stampCheckmark',
    name: 'Checkmark',
    interaction: {
      exclusive: false,
      cursor: 'crosshair',
    },
    matchScore: () => 0,
    defaults: {
      type: PdfAnnotationSubtype.STAMP,
      imageSrc: '/circle-checkmark.png',
      imageSize: { width: 30, height: 30 },
    },
  });

  annotation?.addTool<AnnotationTool<PdfStampAnnoObject>>({
    id: 'stampCross',
    name: 'Cross',
    interaction: {
      exclusive: false,
      cursor: 'crosshair',
    },
    matchScore: () => 0,
    defaults: {
      type: PdfAnnotationSubtype.STAMP,
      imageSrc: '/circle-cross.png',
      imageSize: { width: 30, height: 30 },
    },
  });
};
</script>

<template>
  <div style="height: 600px; display: flex; flex-direction: column; user-select: none">
    <div v-if="isLoading || !engine">Loading PDF Engine...</div>
    <EmbedPDF v-else :engine="engine" :plugins="plugins" @initialized="handleInitialized">
      <div
        class="mb-4 mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
      >
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="handleToolClick(tool.id)"
          :class="[
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            activeTool === tool.id ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200',
          ]"
        >
          {{ tool.name }}
        </button>
        <div class="h-6 w-px bg-gray-200"></div>
        <button
          @click="handleDelete"
          :disabled="!canDelete"
          class="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          Delete Selected
        </button>
      </div>
      <div class="flex-grow" style="position: relative">
        <Viewport style="width: 100%; height: 100%; position: absolute; background-color: #f1f3f5">
          <Scroller>
            <template #default="{ page }">
              <PagePointerProvider
                :page-index="page.pageIndex"
                :page-width="page.width"
                :page-height="page.height"
                :rotation="page.rotation"
                :scale="page.scale"
              >
                <RenderLayer :page-index="page.pageIndex" style="pointer-events: none" />
                <SelectionLayer :page-index="page.pageIndex" :scale="page.scale" />
                <AnnotationLayer
                  :page-index="page.pageIndex"
                  :scale="page.scale"
                  :page-width="page.width"
                  :page-height="page.height"
                  :rotation="page.rotation"
                />
              </PagePointerProvider>
            </template>
          </Scroller>
        </Viewport>
      </div>
    </EmbedPDF>
  </div>
</template>
