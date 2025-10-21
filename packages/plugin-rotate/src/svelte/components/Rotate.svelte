<script lang="ts">
  import type { Size } from '@embedpdf/models';
  import type { Snippet } from 'svelte';
  import { useRotatePlugin } from '../hooks';

  interface RotateProps {
    pageSize: Size;
    children?: Snippet;
  }

  let { pageSize, children }: RotateProps = $props();

  const { plugin: rotate } = useRotatePlugin();

  const transformMatrix = $derived(
    rotate
      ? rotate.getMatrixAsString({
          w: pageSize.width,
          h: pageSize.height,
        })
      : 'matrix(1, 0, 0, 1, 0, 0)',
  );
</script>

<div style:position="absolute" style:transform-origin="0 0" style:transform={transformMatrix}>
  {@render children?.()}
</div>
