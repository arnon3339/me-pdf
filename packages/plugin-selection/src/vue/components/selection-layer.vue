<script setup lang="ts">
import { ref, watchEffect, computed } from 'vue';
import { ignore, PdfErrorCode, PdfPageGeometry, Rect } from '@embedpdf/models';
import {
  useCursor,
  useInteractionManagerCapability,
  usePointerHandlers,
} from '@embedpdf/plugin-interaction-manager/vue';
import { PointerEventHandlersWithLifecycle } from '@embedpdf/plugin-interaction-manager';
import { glyphAt } from '@embedpdf/plugin-selection';
import { useSelectionCapability } from '../hooks';

interface Props {
  pageIndex: number;
  scale: number;
  background?: string;
}

const props = withDefaults(defineProps<Props>(), {
  background: 'rgba(33, 150, 243)', // Default selection color
});

const { provides: sel } = useSelectionCapability();
const { provides: im } = useInteractionManagerCapability();
const { register } = usePointerHandlers({ pageIndex: props.pageIndex });
const { setCursor, removeCursor } = useCursor();

const rects = ref<Rect[]>([]);
const boundingRect = ref<Rect | null>(null);

// Subscribe to selection changes and update the rendered rectangles
watchEffect((onCleanup) => {
  if (sel.value) {
    const unsubscribe = sel.value.onSelectionChange(() => {
      const mode = im.value?.getActiveMode();
      if (mode === 'default') {
        rects.value = sel.value!.getHighlightRectsForPage(props.pageIndex);
        boundingRect.value = sel.value!.getBoundingRectForPage(props.pageIndex);
      } else {
        rects.value = [];
        boundingRect.value = null;
      }
    });
    onCleanup(unsubscribe);
  }
});

// Cache page geometry for faster hit-testing during pointer moves
let geoCache: PdfPageGeometry | undefined;
watchEffect((onCleanup) => {
  if (sel.value) {
    const task = sel.value.getGeometry(props.pageIndex);
    task.wait((g) => (geoCache = g), ignore);

    onCleanup(() => {
      task.abort({
        code: PdfErrorCode.Cancelled,
        message: 'SelectionLayer unmounted',
      });
    });
  }
});

const handlers = computed(
  (): PointerEventHandlersWithLifecycle<PointerEvent> => ({
    onPointerDown: (point, _evt, modeId) => {
      if (!sel.value || !sel.value.isEnabledForMode(modeId)) return;
      sel.value.clear();
      const task = sel.value.getGeometry(props.pageIndex);
      task.wait((geo) => {
        const g = glyphAt(geo, point);
        if (g !== -1) sel.value!.begin(props.pageIndex, g);
      }, ignore);
    },
    onPointerMove: (point, _evt, modeId) => {
      if (!sel.value || !sel.value.isEnabledForMode(modeId)) return;
      const g = geoCache ? glyphAt(geoCache, point) : -1;
      if (g !== -1) {
        setCursor('selection-text', 'text', 10);
        sel.value.update(props.pageIndex, g);
      } else {
        removeCursor('selection-text');
      }
    },
    onPointerUp: (_point, _evt, modeId) => {
      if (!sel.value || !sel.value.isEnabledForMode(modeId)) return;
      sel.value.end();
    },
    onHandlerActiveEnd: (modeId) => {
      if (!sel.value || !sel.value.isEnabledForMode(modeId)) return;
      sel.value.clear();
    },
  }),
);

// Register the pointer handlers with the interaction manager
watchEffect((onCleanup) => {
  if (register) {
    const cleanup = register(handlers.value);
    if (cleanup) onCleanup(cleanup);
  }
});
</script>

<template>
  <div
    v-if="boundingRect"
    :style="{
      position: 'absolute',
      left: `${boundingRect.origin.x * scale}px`,
      top: `${boundingRect.origin.y * scale}px`,
      width: `${boundingRect.size.width * scale}px`,
      height: `${boundingRect.size.height * scale}px`,
      mixBlendMode: 'multiply',
      isolation: 'isolate',
      pointerEvents: 'none',
    }"
  >
    <div
      v-for="(rect, i) in rects"
      :key="i"
      :style="{
        position: 'absolute',
        left: `${(rect.origin.x - boundingRect.origin.x) * scale}px`,
        top: `${(rect.origin.y - boundingRect.origin.y) * scale}px`,
        width: `${rect.size.width * scale}px`,
        height: `${rect.size.height * scale}px`,
        background: background,
      }"
    />
  </div>
</template>
