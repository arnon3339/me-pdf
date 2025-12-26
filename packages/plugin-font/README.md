# @embedpdf/plugin-font

Font plugin for EmbedPDF - enables custom font loading via the Local Font Access API.

## Features

- 🔤 Access user's installed system fonts
- 📦 Load font data (TTF/OTF) for PDF embedding
- 🎯 TypeScript support with full type definitions
- 🖥️ Framework bindings for Vue, React, and Svelte

## Browser Support

> ⚠️ The Local Font Access API is only available in **Chromium-based browsers** (Chrome, Edge).

## Installation

```bash
pnpm add @embedpdf/plugin-font
```

## Usage

### Basic Usage

```typescript
import { EmbedPDF } from '@embedpdf/core';
import { FontPluginPackage } from '@embedpdf/plugin-font';

const pdf = new EmbedPDF({
  plugins: [FontPluginPackage],
});

// Get the font capability
const fontCapability = pdf.getCapability('font');

// Request font access (prompts user for permission)
const fonts = await fontCapability.requestFontAccess();
console.log('Available fonts:', fonts);

// Load a specific font's data
const loadedFont = await fontCapability.loadFont('Arial-Regular');
if (loadedFont) {
  console.log('Font data loaded:', loadedFont.data.byteLength, 'bytes');
}
```

### Vue Usage

```vue
<script setup lang="ts">
import { useFont } from '@embedpdf/plugin-font/vue';

const { 
  localFonts, 
  hasPermission, 
  isLoading, 
  requestAccess, 
  loadFont,
  groupByFamily 
} = useFont();

const handleRequestAccess = async () => {
  try {
    await requestAccess();
  } catch (error) {
    console.error('Font access denied:', error);
  }
};
</script>

<template>
  <button @click="handleRequestAccess" :disabled="isLoading">
    {{ hasPermission ? 'Fonts Loaded' : 'Request Font Access' }}
  </button>
  
  <ul v-if="hasPermission">
    <li v-for="font in localFonts" :key="font.postscriptName">
      {{ font.fullName }}
    </li>
  </ul>
</template>
```

## API

### FontCapability

| Method | Description |
|--------|-------------|
| `isSupported()` | Check if Local Font Access API is available |
| `requestFontAccess()` | Request permission and enumerate fonts |
| `loadFont(postscriptName)` | Load font binary data |
| `getLocalFonts()` | Get list of available fonts |
| `getLoadedFont(name)` | Get a loaded font by name |
| `isFontLoaded(name)` | Check if font is loaded |
| `groupFontsByFamily()` | Group fonts by family name |

### Events

- `onAccessGranted` - Font access was granted
- `onAccessDenied` - Font access was denied
- `onFontLoaded` - A font was successfully loaded
- `onFontLoadError` - Font loading failed

## License

MIT
