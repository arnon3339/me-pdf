/**
 * Represents a font loaded from the Local Font Access API
 */
export interface LocalFont {
    /** Font family name */
    family: string;
    /** Full font name */
    fullName: string;
    /** PostScript name */
    postscriptName: string;
    /** Font style (e.g., "Regular", "Bold", "Italic") */
    style: string;
    /** Numeric font weight (e.g. 400, 700) */
    weight?: number;
    /** Whether the font is italic */
    italic?: boolean;
}

/**
 * Represents a loaded font with its binary data
 */
export interface LoadedFont extends LocalFont {
    /** Font data as ArrayBuffer */
    data: ArrayBuffer;
    /** Font type: 1 = Type1, 2 = TrueType */
    fontType: FontType;
}

/**
 * Font type enum matching PDFium's FPDF_FONT_* constants
 */
export enum FontType {
    Type1 = 1,
    TrueType = 2,
}

/**
 * Font capability state
 */
export interface FontState {
    /** Whether Local Font Access API is available */
    isSupported: boolean;
    /** Whether font access has been granted */
    hasPermission: boolean;
    /** List of available local fonts */
    localFonts: LocalFont[];
    /** Currently loaded fonts (with data) */
    loadedFonts: Map<string, LoadedFont>;
    /** Whether fonts are currently being loaded */
    isLoading: boolean;
}

/**
 * Font plugin capability interface
 */
export interface FontCapability {
    /** Check if Local Font Access API is available */
    isSupported(): boolean;

    /** Request permission and enumerate local fonts */
    requestFontAccess(): Promise<LocalFont[]>;

    /** Load font data for a specific font */
    loadFont(postscriptName: string): Promise<LoadedFont | null>;

    /** Get all available local fonts */
    getLocalFonts(): LocalFont[];

    /** Get a loaded font by postscript name */
    getLoadedFont(postscriptName: string): LoadedFont | undefined;

    /** Check if a font is loaded */
    isFontLoaded(postscriptName: string): boolean;

    /** Group fonts by family */
    groupFontsByFamily(): Map<string, LocalFont[]>;

    /** Event: Font access granted */
    onAccessGranted(listener: (event: FontEvents['font:access-granted']) => void): () => void;

    /** Event: Font access denied */
    onAccessDenied(listener: (event: FontEvents['font:access-denied']) => void): () => void;

    /** Event: Font loaded */
    onFontLoaded(listener: (event: FontEvents['font:loaded']) => void): () => void;

    /** Event: Font load error */
    onFontLoadError(listener: (event: FontEvents['font:load-error']) => void): () => void;
}

/**
 * Font plugin configuration
 */
export interface FontPluginConfig {
    /** Whether to auto-request font access on init */
    autoRequestAccess?: boolean;
}

/**
 * Font plugin events
 */
export interface FontEvents {
    'font:access-granted': { fonts: LocalFont[] };
    'font:access-denied': { error: Error };
    'font:loaded': { font: LoadedFont };
    'font:load-error': { postscriptName: string; error: Error };
}
