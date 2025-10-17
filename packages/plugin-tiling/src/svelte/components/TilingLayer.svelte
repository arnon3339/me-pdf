<script lang="ts">
  import type { Tile } from '@embedpdf/plugin-tiling';
  import type { HTMLAttributes } from 'svelte/elements';
  import TileImg from './TileImg.svelte';
  import { useTilingCapability } from '../hooks';

  type TilingLayoutProps = HTMLAttributes<HTMLDivElement> & {
    pageIndex: number;
    scale: number;
    class?: string;
  };

  let { pageIndex, scale, class: propsClass, ...restProps }: TilingLayoutProps = $props();

  const { provides: tilingProvides } = $derived(useTilingCapability());
  let tiles = $state<Tile[]>([]);

  $effect(() => {
    if (!tilingProvides) return;
    return tilingProvides.onTileRendering((tilesMap) => {
      // dedupe by id so Svelte's keyed each doesn't see duplicate tile keys after doc switches
      const pageTiles = tilesMap[pageIndex] ?? [];

      if (pageTiles.length <= 1) {
        tiles = pageTiles;
        return;
      }

      const seen = new Set<string>();
      const unique: Tile[] = [];

      for (const tile of pageTiles) {
        if (seen.has(tile.id)) continue;
        seen.add(tile.id);
        unique.push(tile);
      }

      tiles = unique;
    });
  });
</script>

<div class={propsClass} {...restProps}>
  {#each tiles as tile (tile.id)}
    <TileImg {pageIndex} {tile} dpr={window.devicePixelRatio} {scale} />
  {/each}
</div>
