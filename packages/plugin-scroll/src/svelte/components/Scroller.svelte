<script lang="ts">
  import { useScrollPlugin } from '../hooks';
  import type { HTMLAttributes } from 'svelte/elements';
  import { type PageLayout, type ScrollerLayout, ScrollStrategy } from '@embedpdf/plugin-scroll';
  import type { PdfDocumentObject, Rotation } from '@embedpdf/models';
  import { useRegistry } from '@embedpdf/core/svelte';
  import { type Snippet } from 'svelte';

  export interface RenderPageProps extends PageLayout {
    rotation: Rotation;
    scale: number;
    document: PdfDocumentObject | null;
  }

  type ScrollerProps = HTMLAttributes<HTMLDivElement> & {
    RenderPageSnippet: Snippet<RenderPageProps>;
    overlayElements?: Snippet[];
  };

  const { plugin: scrollPlugin } = useScrollPlugin();
  const { registry } = useRegistry();
  let scrollerLayout = $state<ScrollerLayout | null>(scrollPlugin?.getScrollerLayout() ?? null);

  let { RenderPageSnippet, overlayElements, ...restProps }: ScrollerProps = $props();

  $effect(() => {
    if (!scrollPlugin) return;
    return scrollPlugin.onScrollerData((layout) => (scrollerLayout = layout));
  });

  $effect(() => {
    if (!scrollPlugin) return;
    scrollPlugin.setLayoutReady();
  });
</script>

{#if scrollerLayout && registry}
  {@const coreState = registry.getStore().getState()}
  <div
    {...restProps}
    style:width={`${scrollerLayout.totalWidth}px`}
    style:height={`${scrollerLayout.totalHeight}px`}
    style:position="relative"
    style:box-sizing="border-box"
    style:margin="0 auto"
    style:display={scrollerLayout.strategy === ScrollStrategy.Horizontal ? 'flex' : null}
    style:flex-direction={scrollerLayout.strategy === ScrollStrategy.Horizontal ? 'row' : null}
  >
    <div
      style:width={scrollerLayout.strategy === ScrollStrategy.Horizontal
        ? `${scrollerLayout.startSpacing}`
        : '100%'}
      style:height={scrollerLayout.strategy === ScrollStrategy.Horizontal
        ? '100%'
        : `${scrollerLayout.startSpacing}`}
      style:flex-shrink="0"
    ></div>
    <div
      style:gap={`${scrollerLayout.pageGap}`}
      style:display="flex"
      style:align-items="center"
      style:position="relative"
      style:box-sizing="border-box"
      style:flex-direction={scrollerLayout.strategy === ScrollStrategy.Horizontal
        ? 'row'
        : 'column'}
      style:min-width={scrollerLayout.strategy === ScrollStrategy.Horizontal
        ? '100%'
        : 'fit-content'}
    >
      {#each scrollerLayout.items as item (item.pageNumbers[0])}
        <div
          style:display="flex"
          style:justify-content="center"
          style:gap={`${scrollerLayout.pageGap}`}
        >
          {#each item.pageLayouts as layout (layout.pageNumber)}
            <div
              style:width={`${layout.rotatedWidth}px`}
              style:height={`${layout.rotatedHeight}px`}
            >
              {@render RenderPageSnippet?.({
                ...layout,
                rotation: coreState.core.rotation,
                scale: coreState.core.scale,
                document: coreState.core.document,
              })}
            </div>
          {/each}
        </div>
      {/each}
    </div>
    <div
      style:width={scrollerLayout.strategy === ScrollStrategy.Horizontal
        ? `${scrollerLayout.endSpacing}`
        : '100%'}
      style:height={scrollerLayout.strategy === ScrollStrategy.Horizontal
        ? '100%'
        : `${scrollerLayout.endSpacing}`}
      style:flex-shrink="0"
    />
    {#if overlayElements && overlayElements.length > 0}
      {#each overlayElements as OverLay}
        {@render OverLay?.()}
      {/each}
    {/if}
  </div>
{/if}
