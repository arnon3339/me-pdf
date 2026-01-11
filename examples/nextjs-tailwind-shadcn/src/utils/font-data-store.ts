/**
 * Global store for custom font data (TTF bytes)
 * 
 * When a user selects a custom font, the font data is loaded
 * and stored here so it can be used during PDF export.
 */

export type FontDataEntry = {
    postscriptName: string;
    familyName: string;
    fullName: string;
    data: ArrayBuffer;
};

class FontDataStore {
    private fonts: Map<string, FontDataEntry> = new Map();

    /**
     * Store font data for a custom font
     */
    set(postscriptName: string, entry: FontDataEntry): void {
        this.fonts.set(postscriptName, entry);
    }

    /**
     * Get font data by postscript name
     */
    get(postscriptName: string): FontDataEntry | undefined {
        return this.fonts.get(postscriptName);
    }

    /**
     * Get all stored font data as a Map for export
     */
    getAll(): Map<string, ArrayBuffer> {
        const result = new Map<string, ArrayBuffer>();
        for (const [key, entry] of this.fonts) {
            result.set(key, entry.data);
        }
        return result;
    }

    /**
     * Check if font data exists for a postscript name
     */
    has(postscriptName: string): boolean {
        return this.fonts.has(postscriptName);
    }

    /**
     * Clear all stored font data
     */
    clear(): void {
        this.fonts.clear();
    }
}

// Global singleton instance
export const fontDataStore = new FontDataStore();
