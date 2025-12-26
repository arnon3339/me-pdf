<template>
  <div
    v-if="annotationProvides"
    class="flex items-center gap-2 border-b border-gray-300 bg-white px-3 py-2"
  >
    <ToolbarButton
      :onClick="() => toggleTool('highlight')"
      :isActive="activeTool?.id === 'highlight'"
      aria-label="Highlight text"
      title="Highlight Text"
    >
      <HighlightIcon class="h-4 w-4" :style="{ color: toolColors.highlight?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('underline')"
      :isActive="activeTool?.id === 'underline'"
      aria-label="Underline text"
      title="Underline"
    >
      <UnderlineIcon class="h-4 w-4" :style="{ color: toolColors.underline?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('strikeout')"
      :isActive="activeTool?.id === 'strikeout'"
      aria-label="Strikethrough text"
      title="Strikethrough"
    >
      <StrikethroughIcon class="h-4 w-4" :style="{ color: toolColors.strikeout?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('squiggly')"
      :isActive="activeTool?.id === 'squiggly'"
      aria-label="Squiggly underline"
      title="Squiggly Underline"
    >
      <SquigglyIcon class="h-4 w-4" :style="{ color: toolColors.squiggly?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('ink')"
      :isActive="activeTool?.id === 'ink'"
      aria-label="Freehand annotation"
      title="Draw Freehand"
    >
      <PenIcon class="h-4 w-4" :style="{ color: toolColors.ink?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('freeText')"
      :isActive="activeTool?.id === 'freeText'"
      aria-label="Text annotation"
      title="Add Text Annotation"
    >
      <TextIcon class="h-4 w-4" :style="{ color: toolColors.freeText?.primaryColor }" />
    </ToolbarButton>

    <!-- Font Settings Button (visible when freeText is active) -->
    <ToolbarButton
      v-if="activeTool?.id === 'freeText'"
      :onClick="() => showFontPanel = !showFontPanel"
      :isActive="showFontPanel"
      aria-label="Font settings"
      title="Font Settings"
    >
      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('circle')"
      :isActive="activeTool?.id === 'circle'"
      aria-label="Circle annotation"
      title="Draw Circle"
    >
      <CircleIcon class="h-4 w-4" :style="{ color: toolColors.circle?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('square')"
      :isActive="activeTool?.id === 'square'"
      aria-label="Square annotation"
      title="Draw Rectangle"
    >
      <SquareIcon class="h-4 w-4" :style="{ color: toolColors.square?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('polygon')"
      :isActive="activeTool?.id === 'polygon'"
      aria-label="Polygon annotation"
      title="Draw Polygon"
    >
      <PolygonIcon class="h-4 w-4" :style="{ color: toolColors.polygon?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('polyline')"
      :isActive="activeTool?.id === 'polyline'"
      aria-label="Polyline annotation"
      title="Draw Polyline"
    >
      <PolylineIcon class="h-4 w-4" :style="{ color: toolColors.polyline?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('line')"
      :isActive="activeTool?.id === 'line'"
      aria-label="Line annotation"
      title="Draw Line"
    >
      <LineIcon class="h-4 w-4" :style="{ color: toolColors.line?.primaryColor }" />
    </ToolbarButton>

    <ToolbarButton
      :onClick="() => toggleTool('lineArrow')"
      :isActive="activeTool?.id === 'lineArrow'"
      aria-label="Arrow annotation"
      title="Draw Arrow"
    >
      <ArrowIcon class="h-4 w-4" :style="{ color: toolColors.lineArrow?.primaryColor }" />
    </ToolbarButton>

    <!-- Divider -->
    <div class="mx-1 h-6 w-px bg-gray-300" />

    <!-- Undo/Redo buttons -->
    <ToolbarButton :onClick="handleUndo" :disabled="!canUndo" aria-label="Undo" title="Undo">
      <UndoIcon class="h-4 w-4" />
    </ToolbarButton>

    <ToolbarButton :onClick="handleRedo" :disabled="!canRedo" aria-label="Redo" title="Redo">
      <RedoIcon class="h-4 w-4" />
    </ToolbarButton>

    <!-- Font Panel -->
    <FreeTextFontPanel
      :documentId="props.documentId"
      :isVisible="showFontPanel && activeTool?.id === 'freeText'"
      @close="showFontPanel = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { AnnotationTool } from '@embedpdf/plugin-annotation/vue';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/vue';
import { useHistoryCapability } from '@embedpdf/plugin-history/vue';
import { ToolbarButton } from './ui';
import {
  HighlightIcon,
  UnderlineIcon,
  StrikethroughIcon,
  SquigglyIcon,
  PenIcon,
  TextIcon,
  CircleIcon,
  SquareIcon,
  PolygonIcon,
  PolylineIcon,
  LineIcon,
  ArrowIcon,
  UndoIcon,
  RedoIcon,
} from './icons';
import FreeTextFontPanel from './FreeTextFontPanel.vue';

const props = defineProps<{
  documentId: string;
}>();

type ToolColors = Record<string, { primaryColor?: string; secondaryColor?: string }>;

function extractToolColors(tools: AnnotationTool[]): ToolColors {
  const colors: ToolColors = {};
  tools.forEach((tool) => {
    const defaults = tool.defaults as any;
    colors[tool.id] = {
      primaryColor: defaults.strokeColor || defaults.color || defaults.fontColor,
      secondaryColor: defaults.color,
    };
  });
  return colors;
}

const { provides: annotationCapability } = useAnnotationCapability();
const { provides: historyCapability } = useHistoryCapability();
const activeTool = ref<AnnotationTool | null>(null);
const canUndo = ref(false);
const canRedo = ref(false);
const toolColors = ref<ToolColors>({});
const showFontPanel = ref(false);

const annotationProvides = computed(() =>
  annotationCapability.value ? annotationCapability.value.forDocument(props.documentId) : null,
);

const historyProvides = computed(() =>
  historyCapability.value ? historyCapability.value.forDocument(props.documentId) : null,
);

// Initialize tool colors
watch(
  annotationCapability,
  (capability) => {
    if (capability) {
      toolColors.value = extractToolColors(capability.getTools());
    }
  },
  { immediate: true },
);

// Watch for active tool changes
watch(
  annotationProvides,
  (provides) => {
    if (!provides) return;

    activeTool.value = provides.getActiveTool();

    const unsubscribe = provides.onActiveToolChange((tool) => {
      activeTool.value = tool;
      // Auto-show font panel when freeText tool is activated
      if (tool?.id === 'freeText') {
        showFontPanel.value = true;
      }
    });

    onUnmounted(() => {
      unsubscribe?.();
    });
  },
  { immediate: true },
);

// Watch for history state changes
watch(
  historyProvides,
  (provides) => {
    if (!provides) return;

    const state = provides.getHistoryState();
    canUndo.value = state.global.canUndo;
    canRedo.value = state.global.canRedo;

    const unsubscribe = provides.onHistoryChange(() => {
      const newState = provides.getHistoryState();
      canUndo.value = newState.global.canUndo;
      canRedo.value = newState.global.canRedo;
    });

    onUnmounted(() => {
      unsubscribe?.();
    });
  },
  { immediate: true },
);

const toggleTool = (toolId: string) => {
  const currentId = activeTool.value?.id ?? null;
  annotationProvides.value?.setActiveTool(currentId === toolId ? null : toolId);
};

const handleUndo = () => {
  historyProvides.value?.undo();
};

const handleRedo = () => {
  historyProvides.value?.redo();
};
</script>

