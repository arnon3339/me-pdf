<script lang="ts">
  import { onMount } from 'svelte';
  import type { HTMLImgAttributes } from 'svelte/elements';

  import { ignore, PdfErrorCode } from '@embedpdf/models';

  import { useRenderCapability, useRenderPlugin } from '../hooks';

  interface RenderLayerProps extends Omit<HTMLImgAttributes, 'style'> {
    pageIndex: number;
    /**
     * The scale factor for rendering the page.
     */
    scale?: number;
    dpr?: number;
    class?: string;
  }

  let { pageIndex, scale, dpr, class: propsClass, ...props }: RenderLayerProps = $props();

  const renderCapability = useRenderCapability();
  const renderPlugin = useRenderPlugin();

  const actualScale = $derived(scale ?? 1);

  let imageUrl = $state<string | null>(null);
  let urlRef: string | null = null;
  let refreshTick = $state(0);

  // Handle refresh subscription
  onMount(() => {
    if (!renderPlugin.plugin) return;
    const unsubscribe = renderPlugin.plugin.onRefreshPages((pages) => {
      if (pages.includes(pageIndex)) {
        refreshTick++;
      }
    });

    return unsubscribe;
  });
  // Handle rendering
  $effect(() => {
    if (renderCapability.provides || (renderCapability.provides && refreshTick)) {
      const task = renderCapability.provides.renderPage({
        pageIndex,
        options: { scaleFactor: actualScale, dpr: dpr || window.devicePixelRatio }
      });

      task.wait((blob) => {
        const url = URL.createObjectURL(blob);
        imageUrl = url;
        urlRef = url;
      }, ignore);

      return () => {
        if (urlRef) {
          URL.revokeObjectURL(urlRef);
          urlRef = null;
        } else {
          task.abort({
            code: PdfErrorCode.Cancelled,
            message: 'canceled render task'
          });
        }
      };
    }
  });

  function handleImageLoad() {
    if (urlRef) {
      URL.revokeObjectURL(urlRef);
      urlRef = null;
    }
  }
</script>

{#if imageUrl}
  <img
    src={imageUrl}
    onload={handleImageLoad}
    {...props}
    style="width: 100%; height: 100%;"
    class={propsClass}
    alt=""
  />
{/if}
