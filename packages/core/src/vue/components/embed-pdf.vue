<script setup lang="ts">
import { ref, provide, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { PluginRegistry, PluginBatchRegistration } from '@embedpdf/core';
import { PdfEngine } from '@embedpdf/models';
import { pdfKey, PDFContextState } from '../context';

const props = defineProps<{
  engine: PdfEngine;
  plugins: PluginBatchRegistration<any, any>[];
  onInitialized?: (registry: PluginRegistry) => Promise<void>;
}>();

/* reactive state */
const registry = shallowRef<PluginRegistry | null>(null);
const isInit     = ref(true);
const pluginsOk  = ref(false);

/* expose to children */
provide<PDFContextState>(pdfKey, { registry, isInitializing: isInit, pluginsReady: pluginsOk });

onMounted(async () => {
  const reg = new PluginRegistry(props.engine);
  reg.registerPluginBatch(props.plugins);
  await reg.initialize();
  await props.onInitialized?.(reg);

  registry.value = reg;
  isInit.value   = false;

  reg.pluginsReady().then(() => (pluginsOk.value = true));
});

onBeforeUnmount(() => registry.value?.destroy());
</script>

<template>
  <!-- scoped slot keeps API parity with React version -->
  <slot :registry="registry"
        :isInitializing="isInit"
        :pluginsReady="pluginsOk" />
</template>