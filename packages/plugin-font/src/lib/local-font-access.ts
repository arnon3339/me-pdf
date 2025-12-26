import { LocalFont, LoadedFont, FontType } from './types';

/**
 * Type declarations for the Local Font Access API
 * @see https://wicg.github.io/local-font-access/
 */
declare global {
    interface Window {
        queryLocalFonts?: () => Promise<FontData[]>;
    }

    interface FontData {
        family: string;
        fullName: string;
        postscriptName: string;
        style: string;
        blob(): Promise<Blob>;
    }
}

/**
 * Check if the Local Font Access API is available
 */
export function isLocalFontAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'queryLocalFonts' in window;
}

/**
 * Request access to local fonts and enumerate them
 * @throws Error if the API is not supported or permission is denied
 */
export async function queryLocalFonts(): Promise<LocalFont[]> {
    if (!isLocalFontAccessSupported()) {
        throw new Error('Local Font Access API is not supported in this browser');
    }

    try {
        const fonts = await window.queryLocalFonts!();
        const seenNames = new Map<string, number>();

        return fonts.map((font) => {
            let psName = font.postscriptName;

            // Handle duplicates by appending counter
            if (seenNames.has(psName)) {
                const count = seenNames.get(psName)! + 1;
                seenNames.set(psName, count);
                psName = `${psName}#${count}`;
            } else {
                seenNames.set(psName, 0);
            }

            const { weight, italic } = parseFontStyle(font.style, font.fullName);
            let specialFamily = font.family;

            const upperName = font.fullName.toUpperCase();
            if (upperName.includes('IT9') || upperName.includes('IT๙')) {
                specialFamily = `${font.family} (IT9)`;
            } else if (psName !== font.postscriptName) {
                // If it's a duplicate but didn't match IT9, label it as variant
                // to distinguish in UI.
                specialFamily = `${font.family} (Variant ${seenNames.get(font.postscriptName)})`;
            }

            return {
                family: specialFamily,
                fullName: font.fullName,
                postscriptName: psName, // Use unique internal name
                style: font.style,
                weight,
                italic,
            };
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
            throw new Error('Font access was denied by the user');
        }
        throw error;
    }
}

/**
 * Load the font data for a specific font
 * @param postscriptName - The PostScript name of the font to load
 */
export async function loadFontData(postscriptName: string): Promise<LoadedFont | null> {
    if (!isLocalFontAccessSupported()) {
        throw new Error('Local Font Access API is not supported in this browser');
    }

    // Check for duplicate index suffix (e.g. "MyFont#1")
    let targetPsName = postscriptName;
    let targetIndex = 0;

    const duplicateMatch = postscriptName.match(/^(.+)#(\d+)$/);
    if (duplicateMatch) {
        targetPsName = duplicateMatch[1];
        targetIndex = parseInt(duplicateMatch[2], 10);
    }

    const fonts = await window.queryLocalFonts!();

    // Find all matches
    const matches = fonts.filter((f) => f.postscriptName === targetPsName);
    const fontData = matches[targetIndex];

    if (!fontData) {
        return null;
    }

    const blob = await fontData.blob();
    const data = await blob.arrayBuffer();

    // Detect font type from data (simplified - assumes TrueType/OpenType)
    const fontType = detectFontType(new Uint8Array(data));

    return {
        family: fontData.family,
        fullName: fontData.fullName,
        postscriptName: fontData.postscriptName,
        style: fontData.style,
        data,
        fontType,
    };
}

/**
 * Detect font type from font file header
 */
function detectFontType(data: Uint8Array): FontType {
    // Check for TrueType/OpenType signature
    // TrueType: 0x00010000 or 'true'
    // OpenType with CFF: 'OTTO'
    // OpenType with TrueType outlines: 0x00010000

    if (data.length < 4) {
        return FontType.TrueType; // Default to TrueType
    }

    const signature = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];

    // Type 1 font signatures (rarely used in modern contexts)
    // PostScript Type 1: starts with '%!'
    if (data[0] === 0x25 && data[1] === 0x21) {
        return FontType.Type1;
    }

    // Default to TrueType for TrueType, OpenType, and WOFF formats
    return FontType.TrueType;
}

/**
 * Group fonts by family
 */
export function groupFontsByFamily(fonts: LocalFont[]): Map<string, LocalFont[]> {
    const grouped = new Map<string, LocalFont[]>();

    for (const font of fonts) {
        const existing = grouped.get(font.family);
        if (existing) {
            existing.push(font);
        } else {
            grouped.set(font.family, [font]);
        }
    }

    return grouped;
}

/**
 * Parse font style string to determine weight and italic
 */
function parseFontStyle(style: string, fullName: string): { weight: number; italic: boolean } {
    const s = (style + ' ' + fullName).toLowerCase();
    let weight = 400;
    let italic = false;

    // Detect Weight
    if (s.includes('thin') || s.includes('hairline')) weight = 100;
    else if (s.includes('extra light') || s.includes('extralight') || s.includes('ultra light')) weight = 200;
    else if (s.includes('light')) weight = 300;
    else if (s.includes('semi bold') || s.includes('semibold') || s.includes('demi bold')) weight = 600;
    else if (s.includes('extra bold') || s.includes('extrabold') || s.includes('ultra bold')) weight = 800;
    else if (s.includes('bold')) weight = 700;
    else if (s.includes('black') || s.includes('heavy')) weight = 900;
    else if (s.includes('medium')) weight = 500;

    // Detect Italic
    if (s.includes('italic') || s.includes('oblique')) {
        italic = true;
    }

    return { weight, italic };
}
