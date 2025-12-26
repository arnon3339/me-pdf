<script setup lang="ts">
/**
 * Standalone FontSelector Component
 * 
 * Demonstrates combining standard PDF fonts with local fonts using the
 * Local Font Access API directly (without requiring EmbedPDF context).
 */
import { ref, computed, onMounted } from 'vue';
import { 
  PdfStandardFont,
  PdfStandardFontFamily,
  STANDARD_FONT_FAMILIES,
  standardFontFamilyLabel,
  type PdfFontRef,
  type PdfCustomFontRef,
  createStandardFontRef,
  createCustomFontRef,
  fontRefToCss,
} from '@embedpdf/models';
import {
  isLocalFontAccessSupported,
  queryLocalFonts,
  groupFontsByFamily,
  type LocalFont,
} from '@embedpdf/plugin-font';

// Props
const props = defineProps<{
  modelValue: PdfFontRef;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: PdfFontRef): void;
}>();

// Local font state
const localFonts = ref<LocalFont[]>([]);
const hasPermission = ref(false);
const isLoading = ref(false);
const supported = ref(false);

// UI state
const isOpen = ref(false);
const activeTab = ref<'standard' | 'custom'>('standard');

// Check support on mount
onMounted(() => {
  supported.value = isLocalFontAccessSupported();
});

// Group custom fonts by family
const customFontFamilies = computed(() => {
  if (!hasPermission.value || localFonts.value.length === 0) return new Map<string, LocalFont[]>();
  return groupFontsByFamily(localFonts.value);
});

// Standard font options for the dropdown
const standardFontOptions = computed(() => 
  STANDARD_FONT_FAMILIES.filter(f => f !== PdfStandardFontFamily.Unknown).map(family => ({
    type: 'standard' as const,
    family,
    label: standardFontFamilyLabel(family),
  }))
);

// Custom font options grouped by family
const customFontOptions = computed(() => {
  const families: { family: string; fonts: PdfCustomFontRef[] }[] = [];
  customFontFamilies.value.forEach((fonts, family) => {
    families.push({
      family,
      fonts: fonts.map(f => createCustomFontRef(
        f.postscriptName,
        f.family,
        f.fullName,
        f.style
      )),
    });
  });
  return families;
});

// Current selection label
const currentLabel = computed(() => {
  const font = props.modelValue;
  if (font.type === 'custom') {
    return font.fullName;
  }
  return standardFontFamilyLabel(
    font.font >= 0 && font.font <= 3 
      ? PdfStandardFontFamily.Courier 
      : font.font >= 4 && font.font <= 7
        ? PdfStandardFontFamily.Helvetica
        : PdfStandardFontFamily.Times
  );
});

// Handle font selection
const selectStandardFont = (family: PdfStandardFontFamily) => {
  let font: PdfStandardFont;
  switch (family) {
    case PdfStandardFontFamily.Courier:
      font = PdfStandardFont.Courier;
      break;
    case PdfStandardFontFamily.Helvetica:
      font = PdfStandardFont.Helvetica;
      break;
    case PdfStandardFontFamily.Times:
      font = PdfStandardFont.Times_Roman;
      break;
    case PdfStandardFontFamily.Symbol:
      font = PdfStandardFont.Symbol;
      break;
    case PdfStandardFontFamily.ZapfDingbats:
      font = PdfStandardFont.ZapfDingbats;
      break;
    default:
      font = PdfStandardFont.Helvetica;
  }
  emit('update:modelValue', createStandardFontRef(font));
  isOpen.value = false;
};

const selectCustomFont = (font: PdfCustomFontRef) => {
  emit('update:modelValue', font);
  isOpen.value = false;
};

// Request font access using the API directly
const handleRequestAccess = async () => {
  if (!supported.value) return;
  
  isLoading.value = true;
  try {
    const fonts = await queryLocalFonts();
    localFonts.value = fonts;
    hasPermission.value = true;
    activeTab.value = 'custom';
  } catch (error) {
    console.error('Font access denied:', error);
    hasPermission.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Close dropdown when clicking outside
const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="relative inline-block w-full">
    <!-- Trigger Button -->
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm"
      @click="isOpen = !isOpen"
    >
      <span :style="{ fontFamily: fontRefToCss(modelValue) }">
        {{ currentLabel }}
      </span>
      <svg class="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Dropdown Panel -->
    <div
      v-if="isOpen"
      class="absolute z-20 mt-1 w-full max-w-md rounded border border-gray-200 bg-white shadow-lg"
    >
      <!-- Tabs -->
      <div class="flex border-b border-gray-200">
        <button
          class="flex-1 px-4 py-2 text-sm font-medium"
          :class="activeTab === 'standard' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'"
          @click="activeTab = 'standard'"
        >
          Standard Fonts
        </button>
        <button
          class="flex-1 px-4 py-2 text-sm font-medium"
          :class="activeTab === 'custom' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'"
          @click="activeTab = 'custom'"
        >
          Local Fonts
        </button>
      </div>

      <!-- Standard Fonts Tab -->
      <div v-if="activeTab === 'standard'" class="max-h-60 overflow-y-auto p-2">
        <button
          v-for="opt in standardFontOptions"
          :key="opt.family"
          class="block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
          @click="selectStandardFont(opt.family)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Custom Fonts Tab -->
      <div v-else class="max-h-60 overflow-y-auto p-2">
        <!-- Not supported -->
        <div v-if="!supported">
          <p class="px-3 py-2 text-sm text-gray-500">
            ⚠️ Local Font Access is not supported in this browser.
            <br><span class="text-xs">Use Chrome or Edge for local font access.</span>
          </p>
        </div>
        <!-- Request access button if not granted -->
        <div v-else-if="!hasPermission">
          <p class="px-3 py-2 text-sm text-gray-600 mb-2">
            Grant permission to access fonts installed on your system.
          </p>
          <button
            class="w-full rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
            :disabled="isLoading"
            @click="handleRequestAccess"
          >
            {{ isLoading ? 'Requesting...' : '🔓 Allow Access to Local Fonts' }}
          </button>
        </div>
        <!-- No fonts found -->
        <div v-else-if="customFontOptions.length === 0">
          <p class="px-3 py-2 text-sm text-gray-500">No fonts found.</p>
        </div>
        <!-- Font list -->
        <template v-else>
          <div class="text-xs text-gray-400 px-2 py-1 mb-1">
            Found {{ localFonts.length }} fonts
          </div>
          <div v-for="group in customFontOptions" :key="group.family" class="mb-2">
            <div class="px-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 py-1">
              {{ group.family }}
            </div>
            <button
              v-for="font in group.fonts"
              :key="font.postscriptName"
              class="block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-gray-100"
              :style="{ fontFamily: `'${font.family}', sans-serif` }"
              @click="selectCustomFont(font)"
            >
              {{ font.style || 'Regular' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
