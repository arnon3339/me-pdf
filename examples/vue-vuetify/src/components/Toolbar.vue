<script setup lang="ts">
import { ref } from 'vue';
import { useFullscreen } from '@embedpdf/plugin-fullscreen/vue';
import { usePan } from '@embedpdf/plugin-pan/vue';
import { useRotateCapability } from '@embedpdf/plugin-rotate/vue';
import { useExportCapability } from '@embedpdf/plugin-export/vue';
import { useLoaderCapability } from '@embedpdf/plugin-loader/vue';
import { useSpread, SpreadMode } from '@embedpdf/plugin-spread/vue';
import { useZoom, ZoomMode } from '@embedpdf/plugin-zoom/vue';
import { useInteractionManager } from '@embedpdf/plugin-interaction-manager/vue';

const { provides: fullscreenProvider, state: fullscreenState } = useFullscreen();
const { provides: panProvider, isPanning } = usePan();
const { provides: rotateProvider } = useRotateCapability();
const { provides: exportProvider } = useExportCapability();
const { provides: loaderProvider } = useLoaderCapability();
const { spreadMode, provides: spreadProvider } = useSpread();
const { provides: zoomProvider, state: zoomState } = useZoom();
const { provides: pointerProvider, state: interactionManagerState } = useInteractionManager();

// Menu state
const mainMenuOpen = ref(false);
const pageSettingsMenuOpen = ref(false);

const handleFullscreenToggle = () => {
  fullscreenProvider?.value?.toggleFullscreen();
  mainMenuOpen.value = false;
  pageSettingsMenuOpen.value = false;
};

const handlePanMode = () => {
  panProvider?.value?.togglePan();
};

const handlePointerMode = () => {
  pointerProvider?.value?.activate('pointerMode');
};

const handleRotateForward = () => {
  rotateProvider?.value?.rotateForward();
  pageSettingsMenuOpen.value = false;
};

const handleRotateBackward = () => {
  rotateProvider?.value?.rotateBackward();
  pageSettingsMenuOpen.value = false;
};

const handleDownload = () => {
  exportProvider?.value?.download();
  mainMenuOpen.value = false;
};

const handleOpenFilePicker = () => {
  loaderProvider?.value?.openFileDialog();
  mainMenuOpen.value = false;
};

const handleSpreadModeChange = (mode: SpreadMode) => {
  spreadProvider?.value?.setSpreadMode(mode);
  pageSettingsMenuOpen.value = false;
};

const handleZoomIn = () => {
  zoomProvider?.value?.zoomIn();
};

const handleZoomOut = () => {
  zoomProvider?.value?.zoomOut();
};
</script>

<template>
  <v-app-bar elevation="0" density="compact" color="surface" class="toolbar">
    <!-- Main Menu -->
    <v-menu v-model="mainMenuOpen" :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-menu" variant="text" size="small" :active="mainMenuOpen" />
      </template>
      <v-list density="compact">
        <v-list-item @click="handleOpenFilePicker">
          <template v-slot:prepend>
            <v-icon>mdi-file-document-outline</v-icon>
          </template>
          <v-list-item-title>Open File</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleDownload">
          <template v-slot:prepend>
            <v-icon>mdi-download-outline</v-icon>
          </template>
          <v-list-item-title>Download</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleFullscreenToggle">
          <template v-slot:prepend>
            <v-icon>
              {{ fullscreenState.isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}
            </v-icon>
          </template>
          <v-list-item-title>
            {{ fullscreenState.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-divider vertical class="mx-3 my-3"></v-divider>

    <!-- Sidebar Toggle (placeholder) -->
    <v-tooltip text="Sidebar" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-dock-left" variant="text" size="small" />
      </template>
    </v-tooltip>

    <!-- Page Settings Menu -->
    <v-menu v-model="pageSettingsMenuOpen" :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-cog-outline"
          variant="text"
          size="small"
          :active="pageSettingsMenuOpen"
        />
      </template>
      <v-list density="compact">
        <v-list-subheader>Page Orientation</v-list-subheader>
        <v-list-item @click="handleRotateForward">
          <template v-slot:prepend>
            <v-icon>mdi-rotate-right</v-icon>
          </template>
          <v-list-item-title>Rotate Clockwise</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleRotateBackward">
          <template v-slot:prepend>
            <v-icon>mdi-rotate-left</v-icon>
          </template>
          <v-list-item-title>Rotate Counter-clockwise</v-list-item-title>
        </v-list-item>

        <v-divider class="my-1"></v-divider>

        <v-list-subheader>Page Layout</v-list-subheader>
        <v-list-item
          @click="() => handleSpreadModeChange(SpreadMode.None)"
          :active="spreadMode === SpreadMode.None"
        >
          <template v-slot:prepend>
            <v-icon>mdi-file-document-outline</v-icon>
          </template>
          <v-list-item-title>Single Page</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="() => handleSpreadModeChange(SpreadMode.Odd)"
          :active="spreadMode === SpreadMode.Odd"
        >
          <template v-slot:prepend>
            <v-icon>mdi-book-open-page-variant-outline</v-icon>
          </template>
          <v-list-item-title>Odd Pages</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="() => handleSpreadModeChange(SpreadMode.Even)"
          :active="spreadMode === SpreadMode.Even"
        >
          <template v-slot:prepend>
            <v-icon>mdi-book-open-outline</v-icon>
          </template>
          <v-list-item-title>Even Pages</v-list-item-title>
        </v-list-item>

        <v-divider class="my-1"></v-divider>

        <v-list-item @click="handleFullscreenToggle">
          <template v-slot:prepend>
            <v-icon>
              {{ fullscreenState.isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}
            </v-icon>
          </template>
          <v-list-item-title>
            {{ fullscreenState.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-divider vertical class="mx-3 my-3"></v-divider>

    <!-- Zoom Controls Placeholder -->
    <div class="toolbar-section">
      <v-tooltip text="Zoom Out" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            @click="handleZoomOut"
            icon="mdi-minus-circle-outline"
            variant="text"
            size="small"
          />
        </template>
      </v-tooltip>

      <span class="zoom-level">{{ Math.round(zoomState.currentZoomLevel * 100) }}%</span>

      <v-tooltip text="Zoom In" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            @click="handleZoomIn"
            icon="mdi-plus-circle-outline"
            variant="text"
            size="small"
          />
        </template>
      </v-tooltip>
    </div>

    <v-divider vertical class="mx-3 my-3"></v-divider>

    <!-- Pan Mode -->
    <v-tooltip text="Pan Mode" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          @click="handlePanMode"
          icon="mdi-hand-back-left-outline"
          variant="text"
          size="small"
          :active="isPanning"
        />
      </template>
    </v-tooltip>

    <!-- Pan Mode -->
    <v-tooltip text="Pointer Mode" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          @click="handlePointerMode"
          icon="mdi-cursor-default-outline"
          variant="text"
          size="small"
          :active="interactionManagerState.activeMode === 'pointerMode'"
        />
      </template>
    </v-tooltip>

    <v-spacer></v-spacer>

    <!-- Search Toggle (placeholder) -->
    <v-tooltip text="Search" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-magnify" variant="text" size="small" />
      </template>
    </v-tooltip>
  </v-app-bar>
</template>

<style scoped>
.toolbar {
  border-bottom: 1px solid #cfd4da;
  padding: 0 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-level {
  color: #6c757d;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
}
</style>
