<script setup lang="ts">
import { computed, ref, watch, useAttrs } from 'vue';
import type { StyleValue, CSSProperties } from 'vue';

import { useViewportCapability, useViewportRef } from '../hooks';

/* -------------------------------------------------- */
/* props & attrs                                      */
/* -------------------------------------------------- */
const props = defineProps<{ style?: StyleValue }>();
const attrs = useAttrs(); // forward class/id/… to <div>

/* -------------------------------------------------- */
/* plugin + reactive viewport gap                     */
/* -------------------------------------------------- */
const { provides: viewportProvides } = useViewportCapability();
const viewportGap = ref(0);

watch(
  viewportProvides,
  (vp) => {
    if (vp) viewportGap.value = vp.getViewportGap();
  },
  { immediate: true },
);

/* -------------------------------------------------- */
/* element ref that wires up scroll / resize logic    */
/* -------------------------------------------------- */
const viewportRef = useViewportRef();

/* -------------------------------------------------- */
/* merged inline style                                */
/* -------------------------------------------------- */
const mergedStyle = computed<StyleValue>(() => {
  const gapStyle: CSSProperties = { padding: `${viewportGap.value}px` };
  const s = props.style;

  if (!s) return gapStyle;

  // string ⇒ put gap in a second entry
  if (typeof s === 'string') return [s, gapStyle];

  // array ⇒ just append
  if (Array.isArray(s)) return [...s, gapStyle];

  // object ⇒ shallow‑copy + extra padding
  return { ...s, ...gapStyle };
});
</script>

<template>
  <div ref="viewportRef" v-bind="attrs" :style="mergedStyle">
    <slot />
  </div>
</template>
