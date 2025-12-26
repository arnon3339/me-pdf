<script setup lang="ts">
/**
 * Font Demo Page
 * 
 * Demonstrates the custom font selection functionality using the 
 * @embedpdf/plugin-font package with the Local Font Access API.
 */
import { ref, computed } from 'vue';
import FontSelector from '../components/FontSelector.vue';
import { 
  createStandardFontRef, 
  PdfStandardFont,
  fontRefToCss,
  type PdfFontRef,
} from '@embedpdf/models';

// Selected font (defaults to Helvetica)
const selectedFont = ref<PdfFontRef>(createStandardFontRef(PdfStandardFont.Helvetica));

// Preview text
const previewText = ref('The quick brown fox jumps over the lazy dog. 1234567890');

// Get font label for display
const fontLabel = computed(() => {
  const font = selectedFont.value;
  if (font.type === 'custom') {
    return font.fullName;
  }
  // Simplified mapping for the demo
  const fontNames: Record<number, string> = {
    [PdfStandardFont.Courier]: 'Courier',
    [PdfStandardFont.Helvetica]: 'Helvetica',
    [PdfStandardFont.Times_Roman]: 'Times Roman',
    [PdfStandardFont.Symbol]: 'Symbol',
    [PdfStandardFont.ZapfDingbats]: 'ZapfDingbats',
  };
  return fontNames[font.font] || 'Unknown';
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">
        Custom Font Selection Demo
      </h1>

      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Select Font</h2>
        
        <div class="mb-6">
          <FontSelector v-model="selectedFont" />
        </div>

        <div class="mt-4 text-sm text-gray-600">
          <strong>Selected:</strong> {{ fontLabel }}
        </div>
      </div>

      <!-- Preview Section -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Preview</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Preview Text
          </label>
          <textarea
            v-model="previewText"
            rows="3"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div 
          class="p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-[100px]"
          :style="{ fontFamily: fontRefToCss(selectedFont), fontSize: '24px' }"
        >
          {{ previewText }}
        </div>

        <div class="mt-4 text-xs text-gray-500">
          <strong>CSS font-family:</strong> {{ fontRefToCss(selectedFont) }}
        </div>
      </div>

      <!-- Info Section -->
      <div class="mt-8 text-center text-sm text-gray-500">
        <p class="mb-2">
          💡 <strong>Note:</strong> Local fonts are only available in Chromium-based browsers (Chrome, Edge).
        </p>
        <p>
          Switch to the "Local Fonts" tab and click "Allow Access" to see your system fonts.
        </p>
      </div>
    </div>
  </div>
</template>
