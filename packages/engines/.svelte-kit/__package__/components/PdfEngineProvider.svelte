<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import type { PdfEngine } from '@embedpdf/models';
  import {setEngineContext} from "../context/pdf-engine-context";


  export interface PdfEngineProviderProps {
    children: Snippet;
    engine: PdfEngine | null;
    isLoading: boolean;
    error: Error | null;
  }

  let { children, ...restProps }: PdfEngineProviderProps = $props();

  onMount(() => {
    setEngineContext(restProps);
  });
</script>

{@render children()}
