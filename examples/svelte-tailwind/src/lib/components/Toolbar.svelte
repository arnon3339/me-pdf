<script lang="ts">
  import ZoomToolbar from './ZoomToolbar.svelte';
  import PageSettings from './PageSettings.svelte';
</script>

<div class="flex w-full items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2">
  <PageSettings />
  <div class="h-6 w-px bg-gray-300"></div>
  <ZoomToolbar />
</div>
