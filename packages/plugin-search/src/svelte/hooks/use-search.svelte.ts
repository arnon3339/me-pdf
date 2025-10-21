import { useCapability, usePlugin } from '@embedpdf/core/svelte';
import { initialState, SearchPlugin, SearchState } from '@embedpdf/plugin-search';

export const useSearchPlugin = () => usePlugin<SearchPlugin>(SearchPlugin.id);
export const useSearchCapability = () => useCapability<SearchPlugin>(SearchPlugin.id);

export const useSearch = () => {
  const { provides } = $derived(useSearchCapability());
  let searchState = $state<SearchState>(initialState);

  $effect(() => {
    if (!provides) return;
    return provides.onStateChange((state) => {
      searchState = state;
    });
  });

  return {
    get state() {
      return searchState;
    },
    get provides() {
      return provides;
    },
  };
};
