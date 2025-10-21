import { ref, onMounted, onUnmounted } from 'vue';
import { useCapability, usePlugin } from '@embedpdf/core/vue';
import { initialState, SearchPlugin, SearchState } from '@embedpdf/plugin-search';

export const useSearchPlugin = () => usePlugin<SearchPlugin>(SearchPlugin.id);
export const useSearchCapability = () => useCapability<SearchPlugin>(SearchPlugin.id);

export const useSearch = () => {
  const { provides } = useSearchCapability();
  const searchState = ref<SearchState>(initialState);

  onMounted(() => {
    if (!provides.value) return;

    const unsubscribe = provides.value.onStateChange((state) => {
      searchState.value = state;
    });

    onUnmounted(() => {
      unsubscribe();
    });
  });

  return {
    state: searchState,
    provides,
  };
};
