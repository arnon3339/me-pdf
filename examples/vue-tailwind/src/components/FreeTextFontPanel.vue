<template>
  <div 
    v-if="isVisible"
    class="absolute right-4 top-16 z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
  >
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900">Text Settings</h3>
      <button 
        @click="$emit('close')" 
        class="text-gray-400 hover:text-gray-600"
        title="Close"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Font Family -->
    <div class="mb-4">
      <label class="mb-1 block text-xs font-medium text-gray-600">Font Family</label>
      <FontSelector v-model="selectedFont" />
    </div>

    <!-- Font Size -->
    <div class="mb-4">
      <label class="mb-1 block text-xs font-medium text-gray-600">Font Size</label>
      <select 
        v-model="fontSize" 
        class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        @change="updateFontSize"
      >
        <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}pt</option>
      </select>
    </div>

    <!-- Font Color -->
    <div class="mb-4">
      <label class="mb-1 block text-xs font-medium text-gray-600">Font Color</label>
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="color in colorPresets" 
          :key="color"
          class="h-6 w-6 rounded border-2 transition-all"
          :class="fontColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'"
          :style="{ backgroundColor: color }"
          @click="setFontColor(color)"
          :title="color"
        />
      </div>
    </div>

    <!-- Info about custom fonts -->
    <div v-if="hasCustomFont" class="mt-4 rounded bg-blue-50 p-2 text-xs text-blue-700">
      <strong>Custom Font:</strong> {{ customFontName }}
      <br>
      <span class="text-blue-600">This font will be embedded in the PDF when exporting.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import FontSelector from './FontSelector.vue';
import { 
  PdfStandardFont,
  type PdfFontRef,
  createStandardFontRef,
} from '@embedpdf/models';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/vue';

const props = defineProps<{
  documentId: string;
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { provides: annotationCapability } = useAnnotationCapability();

// Font settings
const selectedFont = ref<PdfFontRef>(createStandardFontRef(PdfStandardFont.Helvetica));
const fontSize = ref(12);
const fontColor = ref('#000000');

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36, 48, 72];
const colorPresets = [
  '#000000', '#374151', '#DC2626', '#EA580C', '#CA8A04',
  '#16A34A', '#0284C7', '#7C3AED', '#DB2777', '#FFFFFF'
];

// Check if a custom font is selected
const hasCustomFont = computed(() => selectedFont.value.type === 'custom');
const customFontName = computed(() => {
  if (selectedFont.value.type === 'custom') {
    return selectedFont.value.fullName;
  }
  return '';
});

// Update annotation tool defaults when font changes
watch(selectedFont, (newFont) => {
  const capability = annotationCapability.value;
  if (!capability) return;

  // Only update if it's a standard font (custom fonts need special handling)
  if (newFont.type === 'standard') {
    capability.setToolDefaults('freeText', {
      fontFamily: newFont.font
    });
  }
  // For custom fonts, we'd need to load the font binary and use engine.loadCustomFont()
  // This is a placeholder for that integration
});

const updateFontSize = () => {
  const capability = annotationCapability.value;
  if (!capability) return;
  capability.setToolDefaults('freeText', { fontSize: fontSize.value });
};

const setFontColor = (color: string) => {
  fontColor.value = color;
  const capability = annotationCapability.value;
  if (!capability) return;
  capability.setToolDefaults('freeText', { fontColor: color });
};
</script>
