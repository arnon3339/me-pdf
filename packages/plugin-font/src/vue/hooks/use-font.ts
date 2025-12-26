import { ref, watch, readonly, toValue, type MaybeRefOrGetter } from 'vue';
import { useCapability, usePlugin } from '@embedpdf/core/vue';
import { FontPlugin, FontState, LocalFont, LoadedFont } from '@embedpdf/plugin-font';

export const useFontCapability = () => useCapability<FontPlugin>(FontPlugin.id);
export const useFontPlugin = () => usePlugin<FontPlugin>(FontPlugin.id);

/**
 * Initial font state for composable
 */
const initialComposableState: FontState = {
    isSupported: false,
    hasPermission: false,
    localFonts: [],
    loadedFonts: new Map(),
    isLoading: false,
};

/**
 * Hook for accessing local fonts via Local Font Access API
 */
export const useFont = () => {
    const { provides } = useFontCapability();

    const localFonts = ref<LocalFont[]>([]);
    const loadedFonts = ref<Map<string, LoadedFont>>(new Map());
    const hasPermission = ref(false);
    const isLoading = ref(false);

    watch(
        provides,
        (providesValue, _, onCleanup) => {
            if (!providesValue) {
                localFonts.value = [];
                loadedFonts.value = new Map();
                hasPermission.value = false;
                isLoading.value = false;
                return;
            }

            // Get initial state
            const fonts = providesValue.getLocalFonts();
            localFonts.value = fonts;

            // Subscribe to font access events
            const unsubAccessGranted = providesValue.onAccessGranted(({ fonts }) => {
                localFonts.value = fonts;
                hasPermission.value = true;
            });

            const unsubFontLoaded = providesValue.onFontLoaded(({ font }) => {
                const newMap = new Map(loadedFonts.value);
                newMap.set(font.postscriptName, font);
                loadedFonts.value = newMap;
            });

            onCleanup(() => {
                unsubAccessGranted();
                unsubFontLoaded();
            });
        },
        { immediate: true }
    );

    /**
     * Request access to local fonts
     */
    const requestAccess = async (): Promise<LocalFont[]> => {
        if (!provides.value) throw new Error('Font plugin not available');
        isLoading.value = true;
        try {
            const fonts = await provides.value.requestFontAccess();
            hasPermission.value = true;
            return fonts;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Load font data for a specific font
     */
    const loadFont = async (postscriptName: string): Promise<LoadedFont | null> => {
        if (!provides.value) throw new Error('Font plugin not available');
        return provides.value.loadFont(postscriptName);
    };

    /**
     * Group fonts by family
     */
    const groupByFamily = (): Map<string, LocalFont[]> => {
        if (!provides.value) return new Map();
        return provides.value.groupFontsByFamily();
    };

    /**
     * Check if API is supported
     */
    const isSupported = (): boolean => {
        return provides.value?.isSupported() ?? false;
    };

    return {
        localFonts: readonly(localFonts),
        loadedFonts: readonly(loadedFonts),
        hasPermission: readonly(hasPermission),
        isLoading: readonly(isLoading),
        requestAccess,
        loadFont,
        groupByFamily,
        isSupported,
        provides,
    };
};
