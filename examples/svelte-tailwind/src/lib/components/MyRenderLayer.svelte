<script lang="ts">
  import { RenderLayer } from '@embedpdf/plugin-render/svelte';
  import { useLoaderCapability } from '@embedpdf/plugin-loader/svelte';

  let { pageIndex, scale } = $props();

  const loaderCapability = $derived(useLoaderCapability());

  let renderKey = $state(0);

  async function handleDocChange(
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
  ) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    const cap = loaderCapability?.provides;
    if (file && cap) {
      const arrayBuffer = await file.arrayBuffer();
      await cap.loadDocument({
        type: 'buffer',
        pdfFile: {
          id: Math.random().toString(36).substring(2, 15),
          name: file.name,
          content: arrayBuffer,
        },
      });
      // increment key to force re-render
      renderKey++;
    }
  }
</script>

<input type="file" accept="application/pdf" onchange={handleDocChange} />

{#key renderKey}
  <RenderLayer {pageIndex} {scale} />
{/key}
