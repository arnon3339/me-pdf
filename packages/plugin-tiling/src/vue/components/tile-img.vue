<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, toRaw, computed, watchEffect, watch } from 'vue';
import { ignore, PdfErrorCode, PdfErrorReason, Task } from '@embedpdf/models';
import type { StyleValue } from 'vue';

import type { Tile } from '@embedpdf/plugin-tiling';
import { useTilingCapability, useTilingPlugin } from '../hooks';

interface Props {
  pageIndex: number;
  tile: Tile;
  scale: number;
  dpr?: number;
  style?: StyleValue;
}

const props = withDefaults(defineProps<Props>(), {
  dpr: () => window.devicePixelRatio,
});

const { provides: tilingCapability } = useTilingCapability();
const { plugin: tilingPlugin } = useTilingPlugin();

const url = ref<string>();
const refreshTick = ref(0);
let blobUrl: string | null = null;
let renderTask: Task<Blob, PdfErrorReason> | null = null;

/* -------------------------------------------------- */
/* Helper functions                                   */
/* -------------------------------------------------- */
function revoke() {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = null;
  }
}

function abortCurrentTask() {
  if (renderTask && !blobUrl) {
    renderTask.abort({
      code: PdfErrorCode.Cancelled,
      message: 'canceled tile render',
    });
  }
}

/* -------------------------------------------------- */
/* Watch for external refresh events                  */
/* -------------------------------------------------- */
watchEffect((onCleanup) => {
  if (!tilingPlugin.value) return;
  const unsubscribe = tilingPlugin.value.onRefreshPages((pages) => {
    if (pages.includes(props.pageIndex)) {
      refreshTick.value++;
    }
  });
  onCleanup(unsubscribe);
});

/* -------------------------------------------------- */
/* start render task when dependencies change         */
/* -------------------------------------------------- */
function startRender() {
  if (props.tile.status === 'ready' && blobUrl) return; // already done
  if (!tilingCapability.value) return;

  abortCurrentTask();
  revoke();

  const task = tilingCapability.value.renderTile({
    pageIndex: props.pageIndex,
    tile: toRaw(props.tile),
    dpr: props.dpr,
  });

  renderTask = task;
  task.wait((blob) => {
    blobUrl = URL.createObjectURL(blob);
    url.value = blobUrl;
    renderTask = null; // Task completed
  }, ignore);
}

// Watch for changes that require a re-render
watch(
  () => [props.pageIndex, props.tile.id, refreshTick.value, !!tilingCapability.value],
  startRender,
  { immediate: true },
);

/* -------------------------------------------------- */
/* cleanup                                            */
/* -------------------------------------------------- */
onBeforeUnmount(() => {
  abortCurrentTask();
  revoke();
});

/* -------------------------------------------------- */
/* helpers                                            */
/* -------------------------------------------------- */
const relScale = computed(() => props.scale / props.tile.srcScale);
</script>

<template>
  <img
    v-if="url"
    :src="url"
    :style="[
      {
        position: 'absolute',
        left: tile.screenRect.origin.x * relScale + 'px',
        top: tile.screenRect.origin.y * relScale + 'px',
        width: tile.screenRect.size.width * relScale + 'px',
        height: tile.screenRect.size.height * relScale + 'px',
        display: 'block',
      },
      props.style,
    ]"
    @load="revoke"
  />
</template>
