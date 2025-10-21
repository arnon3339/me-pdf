import { ScrollCapability, ScrollPlugin } from '@embedpdf/plugin-scroll';
import { useCapability, usePlugin } from '@embedpdf/core/svelte';

export const useScrollPlugin = () => usePlugin<ScrollPlugin>(ScrollPlugin.id);
export const useScrollCapability = () => useCapability<ScrollPlugin>(ScrollPlugin.id);

// Define the return type explicitly to maintain type safety
interface UseScrollReturn {
  provides: ScrollCapability | null;
  state: {
    currentPage: number;
    totalPages: number;
  };
}

interface SimpleScrollState {
  currentPage: number;
  totalPages: number;
}

export const useScroll = (): UseScrollReturn => {
  const { provides } = $derived(useScrollCapability());
  const state = $state<SimpleScrollState>({ currentPage: 1, totalPages: 1 });

  $effect(() => {
    if (!provides) return;
    return provides.onPageChange(({ pageNumber, totalPages }) => {
      state.currentPage = pageNumber;
      state.totalPages = totalPages;
    });
  });

  return {
    get provides() {
      return provides;
    },
    get state() {
      return state;
    },
  };
};
