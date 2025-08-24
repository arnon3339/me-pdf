<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ignore } from '@embedpdf/models';
import { Unsubscribe } from '@embedpdf/core';

import { useExportCapability, useExportPlugin } from '../hooks';

export interface DownloadProps {
  fileName?: string;
}

const props = withDefaults(defineProps<DownloadProps>(), {
  fileName: 'document.pdf',
});

const { provides: exportCapabilityRef } = useExportCapability();
const { plugin: exportPluginRef } = useExportPlugin();
const anchorRef = ref<HTMLAnchorElement | null>(null);

let unsubscribe: Unsubscribe | null = null;

onMounted(() => {
  const exportCapability = exportCapabilityRef.value;
  const exportPlugin = exportPluginRef.value;

  if (!exportCapability || !exportPlugin) return;

  unsubscribe = exportPlugin.onRequest((action) => {
    if (action === 'download') {
      const el = anchorRef.value;
      if (!el) return;

      const task = exportCapability.saveAsCopy();
      task.wait((buffer) => {
        const url = URL.createObjectURL(new Blob([buffer]));
        el.href = url;
        el.download = props.fileName;
        el.click();
        URL.revokeObjectURL(url);
      }, ignore);
    }
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <a ref="anchorRef" style="display: none" />
</template>
