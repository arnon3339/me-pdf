import { BasePlugin, PluginRegistry, createEmitter } from '@embedpdf/core';
import { FONT_PLUGIN_ID } from './manifest';
import {
    FontPluginConfig,
    FontCapability,
    FontState,
    LocalFont,
    LoadedFont,
    FontEvents,
} from './types';
import {
    isLocalFontAccessSupported,
    queryLocalFonts,
    loadFontData,
    groupFontsByFamily,
} from './local-font-access';

/**
 * Font action types
 */
type FontAction =
    | { type: 'SET_FONTS'; payload: { fonts: LocalFont[] } }
    | { type: 'SET_PERMISSION'; payload: { hasPermission: boolean } }
    | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
    | { type: 'ADD_LOADED_FONT'; payload: { font: LoadedFont } };

/**
 * Initial font state
 */
const initialState: FontState = {
    isSupported: false,
    hasPermission: false,
    localFonts: [],
    loadedFonts: new Map(),
    isLoading: false,
};

/**
 * Font plugin - provides access to local system fonts via Local Font Access API
 */
export class FontPlugin extends BasePlugin<
    FontPluginConfig,
    FontCapability,
    FontState,
    FontAction
> {
    static readonly id = 'font' as const;

    private readonly accessGranted$ = createEmitter<FontEvents['font:access-granted']>();
    private readonly accessDenied$ = createEmitter<FontEvents['font:access-denied']>();
    private readonly fontLoaded$ = createEmitter<FontEvents['font:loaded']>();
    private readonly fontLoadError$ = createEmitter<FontEvents['font:load-error']>();

    constructor(id: string, registry: PluginRegistry, config: FontPluginConfig) {
        super(id, registry);

        // Check browser support on construction
        const isSupported = isLocalFontAccessSupported();
        if (!isSupported) {
            this.logger.warn(
                'FontPlugin',
                'BrowserSupport',
                'Local Font Access API is not supported in this browser'
            );
        }
    }

    /**
     * Build the capability object exposed to other plugins
     */
    protected buildCapability(): FontCapability {
        return {
            isSupported: () => isLocalFontAccessSupported(),
            requestFontAccess: () => this.requestFontAccess(),
            loadFont: (postscriptName) => this.loadFont(postscriptName),
            getLocalFonts: () => this.state.localFonts,
            getLoadedFont: (postscriptName) => this.state.loadedFonts.get(postscriptName),
            isFontLoaded: (postscriptName) => this.state.loadedFonts.has(postscriptName),

            // Events
            onAccessGranted: this.accessGranted$.on,
            onAccessDenied: this.accessDenied$.on,
            onFontLoaded: this.fontLoaded$.on,
            onFontLoadError: this.fontLoadError$.on,

            // Utilities
            groupFontsByFamily: () => groupFontsByFamily(this.state.localFonts),
        };
    }

    /**
     * Request font access from the user
     */
    private async requestFontAccess(): Promise<LocalFont[]> {
        if (!isLocalFontAccessSupported()) {
            const error = new Error('Local Font Access API is not supported');
            this.accessDenied$.emit({ error });
            throw error;
        }

        this.dispatch({ type: 'SET_LOADING', payload: { isLoading: true } });

        try {
            const fonts = await queryLocalFonts();

            this.dispatch({ type: 'SET_FONTS', payload: { fonts } });
            this.dispatch({ type: 'SET_PERMISSION', payload: { hasPermission: true } });
            this.accessGranted$.emit({ fonts });

            this.logger.info(
                'FontPlugin',
                'AccessGranted',
                `Loaded ${fonts.length} local fonts`
            );

            return fonts;
        } catch (error) {
            this.dispatch({ type: 'SET_PERMISSION', payload: { hasPermission: false } });
            this.accessDenied$.emit({ error: error as Error });

            this.logger.error(
                'FontPlugin',
                'AccessDenied',
                `Font access denied: ${(error as Error).message}`
            );

            throw error;
        } finally {
            this.dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
    }

    /**
     * Load font data for a specific font
     */
    private async loadFont(postscriptName: string): Promise<LoadedFont | null> {
        // Check if already loaded
        const existing = this.state.loadedFonts.get(postscriptName);
        if (existing) {
            return existing;
        }

        try {
            const font = await loadFontData(postscriptName);

            if (font) {
                this.dispatch({ type: 'ADD_LOADED_FONT', payload: { font } });
                this.fontLoaded$.emit({ font });

                this.logger.debug(
                    'FontPlugin',
                    'FontLoaded',
                    `Loaded font: ${font.fullName}`
                );
            }

            return font;
        } catch (error) {
            this.fontLoadError$.emit({
                postscriptName,
                error: error as Error,
            });

            this.logger.error(
                'FontPlugin',
                'FontLoadError',
                `Failed to load font ${postscriptName}: ${(error as Error).message}`
            );

            return null;
        }
    }

    /**
     * Initialize the plugin
     */
    async initialize(): Promise<void> {
        this.logger.info('FontPlugin', 'Initialize', 'Font plugin initialized');
    }

    /**
     * Destroy the plugin
     */
    async destroy(): Promise<void> {
        this.accessGranted$.clear();
        this.accessDenied$.clear();
        this.fontLoaded$.clear();
        this.fontLoadError$.clear();
        super.destroy();
    }
}
