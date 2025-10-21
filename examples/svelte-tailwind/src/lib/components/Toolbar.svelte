<script lang="ts">
  import { useFullscreen } from '@embedpdf/plugin-fullscreen/svelte';
  import { useExportCapability } from '@embedpdf/plugin-export/svelte';
  import { useLoaderCapability } from '@embedpdf/plugin-loader/svelte';
  import { clickOutside } from '../actions/click-outside';
  import ZoomToolbar from './ZoomToolbar.svelte';
  import PageSettings from './PageSettings.svelte';

  const { provides: fullscreenProvider, state: fullscreenState } = useFullscreen();
  const { provides: exportProvider } = useExportCapability();
  const { provides: loaderProvider } = useLoaderCapability();

  let isMenuOpen = $state(false);

  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
  };

  const closeMenu = () => {
    isMenuOpen = false;
  };

  const handleOpenFile = () => {
    loaderProvider?.openFileDialog();
    closeMenu();
  };

  const handleDownload = () => {
    exportProvider?.download();
    closeMenu();
  };

  const handleFullscreenToggle = () => {
    fullscreenProvider?.toggleFullscreen();
    closeMenu();
  };
</script>

<div class="flex w-full items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2">
  <!-- Menu Button -->
  <div class="relative" use:clickOutside={closeMenu}>
    <button
      class="flex h-8 w-8 items-center justify-center text-gray-600 transition-colors {isMenuOpen
        ? 'bg-gray-200 text-gray-900'
        : 'hover:bg-gray-100 hover:text-gray-900'}"
      onclick={toggleMenu}
      title="Menu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M4 6l16 0" />
        <path d="M4 12l16 0" />
        <path d="M4 18l16 0" />
      </svg>
    </button>

    {#if isMenuOpen}
      <div
        class="absolute left-0 top-full z-50 mt-2 w-48 origin-top-left rounded border border-gray-200 bg-white shadow-lg"
      >
        <div class="p-1">
          <button
            class="flex w-full items-center justify-start gap-2 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            onclick={handleOpenFile}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0 text-gray-500"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M12 21h-5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v4.5" />
              <path d="M16.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" />
              <path d="M18.5 19.5l2.5 2.5" />
            </svg>
            <span>Open File</span>
          </button>
          <button
            class="flex w-full items-center justify-start gap-2 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            onclick={handleDownload}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0 text-gray-500"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
              <path d="M7 11l5 5l5 -5" />
              <path d="M12 4l0 12" />
            </svg>
            <span>Download</span>
          </button>
          <button
            class="flex w-full items-center justify-start gap-2 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            onclick={handleFullscreenToggle}
          >
            {#if fullscreenState.isFullscreen}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0 text-gray-500"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M15 19v-2a2 2 0 0 1 2 -2h2" />
                <path d="M15 5v2a2 2 0 0 0 2 2h2" />
                <path d="M5 15h2a2 2 0 0 1 2 2v2" />
                <path d="M5 9h2a2 2 0 0 0 2 -2v-2" />
              </svg>
              <span>Exit Fullscreen</span>
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0 text-gray-500"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M16 4l4 0l0 4" />
                <path d="M14 10l6 -6" />
                <path d="M8 20l-4 0l0 -4" />
                <path d="M4 20l6 -6" />
                <path d="M16 20l4 0l0 -4" />
                <path d="M14 14l6 6" />
                <path d="M8 4l-4 0l0 4" />
                <path d="M4 4l6 6" />
              </svg>
              <span>Fullscreen</span>
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <div class="h-6 w-px bg-gray-300"></div>

  <PageSettings />
  <div class="h-6 w-px bg-gray-300"></div>
  <ZoomToolbar />
</div>
