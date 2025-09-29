<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watchEffect, useAttrs } from 'vue';
import { useThumbnailPlugin } from '../hooks';
import type { WindowState } from '@embedpdf/plugin-thumbnail';

const attrs = useAttrs();

const { plugin: thumbnailPlugin } = useThumbnailPlugin();
const viewportRef = ref<HTMLDivElement | null>(null);
const windowState = ref<WindowState | null>(null);

let offWindow: (() => void) | null = null;
let offScrollTo: (() => void) | null = null;

watchEffect((onCleanup) => {
  if (!thumbnailPlugin.value) return;
  offWindow?.();
  offWindow = thumbnailPlugin.value.onWindow((w) => (windowState.value = w));
  onCleanup(() => offWindow?.());
});

onMounted(() => {
  const vp = viewportRef.value;
  if (!vp || !thumbnailPlugin.value) return;

  const onScroll = () => thumbnailPlugin.value!.updateWindow(vp.scrollTop, vp.clientHeight);
  vp.addEventListener('scroll', onScroll);

  // initial push
  thumbnailPlugin.value.updateWindow(vp.scrollTop, vp.clientHeight);

  offScrollTo = thumbnailPlugin.value.onScrollTo(({ top, behavior }) => {
    vp.scrollTo({ top, behavior });
  });

  onBeforeUnmount(() => {
    vp.removeEventListener('scroll', onScroll);
  });
});

onBeforeUnmount(() => {
  offWindow?.();
  offScrollTo?.();
});
</script>

<template>
  <div ref="viewportRef" :style="{ overflowY: 'auto', position: 'relative' }" v-bind="attrs">
    <div :style="{ height: (windowState?.totalHeight ?? 0) + 'px', position: 'relative' }">
      <!-- ✅ Use a template v-for to render the default scoped slot -->
      <template v-for="m in windowState?.items ?? []" :key="m.pageIndex">
        <slot :meta="m" />
      </template>
    </div>
  </div>
</template>
