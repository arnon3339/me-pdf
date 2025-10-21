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

export const useScroll = (): UseScrollReturn => {
  const { provides } = $derived(useScrollCapability());
  let currentPage = $state(1);
  let totalPages = $state(1);

  $effect(() => {
    if (!provides) return;
    return provides.onPageChange(({ pageNumber, totalPages: tp }) => {
      currentPage = pageNumber;
      totalPages = tp;
    });
  });

  return {
    // New format (preferred)
    get provides() {
      return provides;
    },
    // TODO - is this the correct way to keep it reactive?
    get state() {
      return { currentPage, totalPages };
    },
  };
};
