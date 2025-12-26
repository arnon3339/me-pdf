import { PluginPackage } from '@embedpdf/core';
import { manifest, FONT_PLUGIN_ID } from './manifest';
import { FontPluginConfig, FontState } from './types';
import { FontPlugin } from './font-plugin';

/**
 * Font action types for reducer
 */
type FontAction =
    | { type: 'SET_FONTS'; payload: { fonts: import('./types').LocalFont[] } }
    | { type: 'SET_PERMISSION'; payload: { hasPermission: boolean } }
    | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
    | { type: 'ADD_LOADED_FONT'; payload: { font: import('./types').LoadedFont } };

/**
 * Initial font state
 */
const initialState: FontState = {
    isSupported: typeof window !== 'undefined' && 'queryLocalFonts' in window,
    hasPermission: false,
    localFonts: [],
    loadedFonts: new Map(),
    isLoading: false,
};

/**
 * Font state reducer
 */
function reducer(state: FontState, action: FontAction): FontState {
    switch (action.type) {
        case 'SET_FONTS':
            return {
                ...state,
                localFonts: action.payload.fonts,
            };
        case 'SET_PERMISSION':
            return {
                ...state,
                hasPermission: action.payload.hasPermission,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload.isLoading,
            };
        case 'ADD_LOADED_FONT': {
            const newMap = new Map(state.loadedFonts);
            newMap.set(action.payload.font.postscriptName, action.payload.font);
            return {
                ...state,
                loadedFonts: newMap,
            };
        }
        default:
            return state;
    }
}

/**
 * Font plugin package - ready to use in EmbedPDF
 */
export const FontPluginPackage: PluginPackage<
    FontPlugin,
    FontPluginConfig,
    FontState,
    FontAction
> = {
    manifest,
    create: (registry, config) => new FontPlugin(FONT_PLUGIN_ID, registry, config),
    reducer,
    initialState: () => initialState,
};

export * from './font-plugin';
export * from './types';
export * from './manifest';
export * from './local-font-access';
