<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { ignore, PdfErrorCode } from '@embedpdf/models';
import type { StyleValue } from 'vue';

import { useRenderCapability } from '../hooks';

interface Props {
  pageIndex: number;
  scaleFactor?: number;
  dpr?: number;
  style?: StyleValue;
}

const props = withDefaults(defineProps<Props>(), {
  scaleFactor: 1,
  dpr: 1,
});

const { provides: renderProvides } = useRenderCapability();

const imageUrl = ref<string | null>(null);
let currentBlobUrl: string | null = null;

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
  revoke();
  imageUrl.value = null;

  if (!renderProvides.value) return;

  const task = renderProvides.value.renderPage({
    pageIndex: props.pageIndex,
    scaleFactor: props.scaleFactor,
    dpr: props.dpr,
  });

  task.wait((blob) => {
    currentBlobUrl = URL.createObjectURL(blob);
    imageUrl.value = currentBlobUrl;
  }, ignore);

  onBeforeUnmount(() => {
    /* if we unmount before task resolves, abort it */
    if (!currentBlobUrl) {
      task.abort({
        code: PdfErrorCode.Cancelled,
        message: 'canceled render task',
      });
    }
  });
}

watch(() => [props.pageIndex, props.scaleFactor, props.dpr, renderProvides.value], startRender, {
  immediate: true,
});

/* ------------------------------------------ */
onBeforeUnmount(revoke);
</script>

<template>
  <img v-if="imageUrl" :src="imageUrl" :style="[{ width: '100%', height: '100%' }, props.style]" />
</template>
