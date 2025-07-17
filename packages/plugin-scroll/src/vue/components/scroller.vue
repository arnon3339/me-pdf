<script setup lang="ts">
import { computed, onMounted, ref, watchEffect, useAttrs } from 'vue';
import type { StyleValue } from 'vue';
import { useRegistry } from '@embedpdf/core/vue';

import { useScrollCapability, useScrollPlugin } from '../hooks';
import { ScrollStrategy, type ScrollerLayout, type PageLayout } from '@embedpdf/plugin-scroll';
import type { PdfDocumentObject, Rotation } from '@embedpdf/models';

/* -------------------------------------------------- */
/* props                                              */
/* -------------------------------------------------- */
interface RenderPageProps extends PageLayout {
  rotation: Rotation;
  scale: number;
  document: PdfDocumentObject | null;
}

const props = withDefaults(
  defineProps<{
    style?: StyleValue;
    renderPage: (p: RenderPageProps) => any;
    overlayElements?: any[];
  }>(),
  { overlayElements: () => [] },
);

const attrs = useAttrs();

/* -------------------------------------------------- */
/* plugin + state                                     */
/* -------------------------------------------------- */
const { provides: scrollProvides } = useScrollCapability();
const { plugin: scrollPlugin } = useScrollPlugin();
const { registry } = useRegistry();

const layout = ref<ScrollerLayout | null>(null);

/* subscribe to scroller‑data */
watchEffect((onCleanup) => {
  if (!scrollProvides.value) return;

  layout.value = scrollProvides.value.getScrollerLayout();
  const off = scrollProvides.value.onScrollerData((l) => (layout.value = l));
  onCleanup(off);
});

/* mark layout ready once plugin instance exists */
onMounted(() => {
  if (scrollPlugin.value) scrollPlugin.value.setLayoutReady();
});

/* -------------------------------------------------- */
/* combined root style                                */
/* -------------------------------------------------- */
const rootStyle = computed<StyleValue>(() => {
  if (!layout.value) return props.style;

  const base =
    typeof props.style === 'object' && !Array.isArray(props.style)
      ? { ...props.style }
      : (props.style ?? {});

  return [
    base,
    {
      width: `${layout.value.totalWidth}px`,
      height: `${layout.value.totalHeight}px`,
      position: 'relative',
      boxSizing: 'border-box',
      margin: '0 auto',
      ...(layout.value.strategy === ScrollStrategy.Horizontal && {
        display: 'flex',
        flexDirection: 'row',
      }),
    },
  ];
});
</script>

<template>
  <div :style="rootStyle" v-bind="attrs" v-if="layout && registry">
    <!-- leading spacer -->
    <div
      v-if="layout.strategy === 'horizontal'"
      :style="{ width: layout.startSpacing + 'px', height: '100%', flexShrink: 0 }"
    />
    <div v-else :style="{ height: layout.startSpacing + 'px', width: '100%' }" />

    <!-- page grid -->
    <div
      :style="{
        gap: layout.pageGap + 'px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        flexDirection: layout.strategy === 'horizontal' ? 'row' : 'column',
        minHeight: layout.strategy === 'horizontal' ? '100%' : undefined,
        minWidth: layout.strategy === 'vertical' ? 'fit-content' : undefined,
      }"
    >
      <template v-for="item in layout.items" :key="item.pageNumbers[0]">
        <div
          :style="{
            display: 'flex',
            justifyContent: 'center',
            gap: layout.pageGap + 'px',
          }"
        >
          <div
            v-for="pl in item.pageLayouts"
            :key="pl.pageNumber"
            :style="{ width: pl.rotatedWidth + 'px', height: pl.rotatedHeight + 'px' }"
          >
            <!-- call the renderPage prop -->
            <component
              :is="props.renderPage"
              v-bind="{
                ...pl,
                rotation: registry.getStore().getState().core.rotation,
                scale: registry.getStore().getState().core.scale,
                document: registry.getStore().getState().core.document,
              }"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- trailing spacer -->
    <div
      v-if="layout.strategy === 'horizontal'"
      :style="{ width: layout.endSpacing + 'px', height: '100%', flexShrink: 0 }"
    />
    <div v-else :style="{ height: layout.endSpacing + 'px', width: '100%' }" />

    <!-- overlay elements -->
    <component v-for="(el, i) in props.overlayElements" :is="el" :key="i" />
  </div>
</template>
