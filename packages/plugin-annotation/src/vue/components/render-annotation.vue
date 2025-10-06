<template>
  <img
    v-if="imageUrl"
    :src="imageUrl"
    @load="handleImageLoad"
    :style="{
      width: '100%',
      height: '100%',
      display: 'block',
      ...style,
    }"
  />
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, CSSProperties } from 'vue';
import { ignore, PdfAnnotationObject, PdfErrorCode } from '@embedpdf/models';
import { useAnnotationCapability } from '../hooks';

const props = withDefaults(
  defineProps<{
    pageIndex: number;
    annotation: PdfAnnotationObject;
    scaleFactor?: number;
    style?: CSSProperties;
  }>(),
  {
    scaleFactor: 1,
  },
);

const { provides: annotationProvides } = useAnnotationCapability();
const imageUrl = ref<string | null>(null);
const urlRef = ref<string | null>(null);
const currentTask = ref<any>(null);

watch(
  () => [
    props.pageIndex,
    props.scaleFactor,
    props.annotation.id,
    props.annotation.rect.size.width,
    props.annotation.rect.size.height,
    annotationProvides,
  ],
  (_, __, onCleanup) => {
    if (annotationProvides.value) {
      if (urlRef.value) {
        URL.revokeObjectURL(urlRef.value);
        urlRef.value = null;
      }

      const task = annotationProvides.value.renderAnnotation({
        pageIndex: props.pageIndex,
        annotation: props.annotation,
        options: {
          scaleFactor: props.scaleFactor,
          dpr: window.devicePixelRatio,
        },
      });

      currentTask.value = task;

      task.wait((blob) => {
        const url = URL.createObjectURL(blob);
        imageUrl.value = url;
        urlRef.value = url;
      }, ignore);

      onCleanup(() => {
        if (urlRef.value) {
          URL.revokeObjectURL(urlRef.value);
          urlRef.value = null;
        } else {
          task.abort({
            code: PdfErrorCode.Cancelled,
            message: 'canceled render task',
          });
        }
      });
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (urlRef.value) {
    URL.revokeObjectURL(urlRef.value);
    urlRef.value = null;
  }
  if (currentTask.value) {
    currentTask.value.abort({
      code: PdfErrorCode.Cancelled,
      message: 'canceled render task on unmount',
    });
  }
});

const handleImageLoad = () => {
  if (urlRef.value) {
    URL.revokeObjectURL(urlRef.value);
    urlRef.value = null;
  }
};
</script>
