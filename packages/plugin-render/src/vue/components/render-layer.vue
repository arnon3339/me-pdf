<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { ignore, PdfErrorCode, PdfErrorReason, Task } from '@embedpdf/models';

import { useRenderCapability } from '../hooks';

interface Props {
  pageIndex: number;
  scaleFactor?: number;
  dpr?: number;
}

const props = withDefaults(defineProps<Props>(), {
  scaleFactor: 1,
  dpr: 1,
});

const { provides: renderProvides } = useRenderCapability();

const imageUrl = ref<string | null>(null);
let currentBlobUrl: string | null = null;
let currentTask: Task<Blob, PdfErrorReason> | null = null; // Track current render task

/* ------------------------------------------ */
/* Helper function to abort current task */
/* ------------------------------------------ */
function abortCurrentTask() {
  if (currentTask && !currentBlobUrl) {
    currentTask.abort({
      code: PdfErrorCode.Cancelled,
      message: 'canceled render task',
    });
  }
}

/* ------------------------------------------ */
/* render whenever pageIndex/scale/dpr change */
/* ------------------------------------------ */
function revoke() {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
}

function startRender() {
  // Abort any existing task
  abortCurrentTask();

  revoke();
  imageUrl.value = null;
  currentTask = null;

  if (!renderProvides.value) return;

  const task = renderProvides.value.renderPage({
    pageIndex: props.pageIndex,
    scaleFactor: props.scaleFactor,
    dpr: props.dpr,
  });

  currentTask = task;

  task.wait((blob) => {
    currentBlobUrl = URL.createObjectURL(blob);
    imageUrl.value = currentBlobUrl;
    currentTask = null; // Task completed
  }, ignore);
}

watch(() => [props.pageIndex, props.scaleFactor, props.dpr, renderProvides.value], startRender, {
  immediate: true,
});

/* ------------------------------------------ */
onBeforeUnmount(() => {
  // Abort any pending task when component unmounts
  abortCurrentTask();
  revoke();
});
</script>

<template>
  <img v-if="imageUrl" :src="imageUrl" :style="{ width: '100%', height: '100%' }" @load="revoke" />
</template>
