<template>
  <iframe
    ref="iframeRef"
    title="Print Document"
    src="about:blank"
    :style="{
      position: 'absolute',
      display: 'none',
    }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PdfErrorCode } from '@embedpdf/models';
import { usePrintCapability, usePrintPlugin } from '../hooks';

const iframeRef = ref<HTMLIFrameElement | null>(null);
const urlRef = ref<string | null>(null);

const { provides: printCapability } = usePrintCapability();
const { plugin: printPlugin } = usePrintPlugin();

let unsubscribe: (() => void) | undefined;

onMounted(() => {
  if (!printCapability.value || !printPlugin.value) return;

  unsubscribe = printPlugin.value.onPrintRequest((request) => {
    const { options, task } = request;
    const iframe = iframeRef.value;

    if (!iframe) {
      task.reject({
        code: PdfErrorCode.Cancelled,
        message: 'Print iframe not available',
      });
      return;
    }

    // Cleanup previous URL
    if (urlRef.value) {
      URL.revokeObjectURL(urlRef.value);
      urlRef.value = null;
    }

    iframe.src = 'about:blank';

    const prepareTask = printPlugin.value!.preparePrintDocument(options);
    prepareTask.wait((buffer) => {
      task.progress({ stage: 'document-ready', message: 'Document prepared successfully' });

      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      urlRef.value = url;

      iframe.onload = () => {
        if (iframe.src === url) {
          task.progress({ stage: 'iframe-ready', message: 'Ready to print' });
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          task.progress({ stage: 'printing', message: 'Print dialog opened' });
          task.resolve(buffer);
        }
      };

      iframe.src = url;
    }, task.fail);
  });
});

onUnmounted(() => {
  unsubscribe?.();
  if (urlRef.value) {
    URL.revokeObjectURL(urlRef.value);
  }
});
</script>
