<script setup lang="ts">
import { usePdfiumEngine } from '@embedpdf/engines/vue';

const { engine, isLoading, error } = usePdfiumEngine();
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <div v-if="isLoading">Loading Pdfium…</div>
    <div v-else-if="error" class="text-red-600">
      Error: {{ error.message }}
    </div>
    <div v-else class="space-y-4 text-center">
      <h1 class="text-2xl font-semibold">Pdfium loaded 🎉</h1>
      <p class="text-sm text-gray-500">
        Engine: <code class="font-mono">{{ engine ? 'Ready' : 'Not Ready' }}</code>
      </p>
      <p class="text-xs text-gray-400">(Replace this block with your viewer UI later.)</p>
    </div>
  </div>
</template>