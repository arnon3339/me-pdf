import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type {
    PdfFreeTextAnnoObject,
    PdfAnnotationObject,
} from '@embedpdf/models';
import { isStandardFontRef, isCustomFontRef, PdfFontRef } from '@embedpdf/models';

/**
 * Map of font postscript names to loaded font data (TTF/OTF bytes)
 */
export type FontDataMap = Map<string, ArrayBuffer>;

/**
 * Parse a hex color string (#RRGGBB or #RGB) to rgb values (0-1)
 */
function parseHexColor(color: string): { r: number; g: number; b: number } {
    let hex = color.replace('#', '');

    // Handle short format (#RGB)
    if (hex.length === 3) {
        hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    return { r, g, b };
}

/**
 * Check if an annotation is a FreeText annotation
 */
function isFreeTextAnnotation(anno: PdfAnnotationObject): anno is PdfFreeTextAnnoObject {
    // Note: FreeText is type 3 in the plugin state (not 2 as in PDF spec enum)
    return anno.type === 3;
}

/**
 * Export a PDF with custom fonts embedded using pdf-lib.
 * 
 * This function takes a base PDF (exported from PDFium) and overlays
 * FreeText annotations that use custom fonts with properly embedded fonts.
 * 
 * @param basePdfBytes - The base PDF bytes from PDFium export
 * @param annotations - All annotations (will filter for FreeText with custom fonts)
 * @param fontDataMap - Map of font postscript names to TTF/OTF byte data
 * @returns Promise<Uint8Array> - The final PDF with embedded custom fonts
 */
export async function exportPdfWithCustomFonts(
    basePdfBytes: Uint8Array,
    annotations: PdfAnnotationObject[],
    fontDataMap: FontDataMap
): Promise<Uint8Array> {
    // Load the base PDF
    const pdfDoc = await PDFDocument.load(basePdfBytes);

    // Register fontkit for custom font support
    pdfDoc.registerFontkit(fontkit);

    // Cache for embedded fonts to avoid re-embedding the same font
    const embeddedFonts = new Map<string, Awaited<ReturnType<typeof pdfDoc.embedFont>>>();

    // Process each FreeText annotation with a custom font
    console.log('[pdf-lib Export] Processing', annotations.length, 'annotations');

    for (const anno of annotations) {
        console.log('[pdf-lib Export] Checking annotation:', anno.id, 'type:', anno.type);

        if (!isFreeTextAnnotation(anno)) {
            console.log('[pdf-lib Export] Skipping non-FreeText annotation type:', anno.type);
            continue;
        }

        const fontRef = anno.fontFamily as PdfFontRef;

        // Skip standard fonts - PDFium already handled those
        if (isStandardFontRef(fontRef)) {
            continue;
        }

        // Only process custom fonts
        if (!isCustomFontRef(fontRef)) {
            continue;
        }

        const fontData = fontDataMap.get(fontRef.postscriptName);
        if (!fontData) {
            console.warn(`Custom font data not found for: ${fontRef.fullName} (${fontRef.postscriptName})`);
            continue;
        }

        // Get or embed the font
        let font = embeddedFonts.get(fontRef.postscriptName);
        if (!font) {
            try {
                font = await pdfDoc.embedFont(fontData);
                embeddedFonts.set(fontRef.postscriptName, font);
            } catch (error) {
                console.error(`Failed to embed font ${fontRef.fullName}:`, error);
                continue;
            }
        }

        // Get the page
        const pages = pdfDoc.getPages();
        if (anno.pageIndex < 0 || anno.pageIndex >= pages.length) {
            console.warn(`Invalid page index: ${anno.pageIndex}`);
            continue;
        }
        const page = pages[anno.pageIndex];
        const pageHeight = page.getHeight();

        // Calculate position in PDF coordinates (origin at bottom-left)
        // The annotation rect origin is at top-left in device coordinates
        const x = anno.rect.origin.x;
        const y = pageHeight - anno.rect.origin.y - anno.rect.size.height;

        // Parse the font color
        const color = parseHexColor(anno.fontColor || '#000000');

        // Get the text content
        const text = anno.contents || '';

        if (!text) {
            continue;
        }

        // Only draw background if user explicitly set one (not transparent)
        if (anno.backgroundColor && anno.backgroundColor !== 'transparent') {
            const bgColor = parseHexColor(anno.backgroundColor);
            page.drawRectangle({
                x: anno.rect.origin.x,
                y: pageHeight - anno.rect.origin.y - anno.rect.size.height,
                width: anno.rect.size.width,
                height: anno.rect.size.height,
                color: rgb(bgColor.r, bgColor.g, bgColor.b),
                opacity: anno.opacity ?? 1,
            });
        }

        // Draw text lines
        const lines = text.split('\n');
        const lineHeight = anno.fontSize * 1.2; // Approximate line height

        let currentY = y + anno.rect.size.height - anno.fontSize; // Start from top

        for (const line of lines) {
            page.drawText(line, {
                x: x + 4, // Small padding from edge
                y: currentY,
                size: anno.fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity: anno.opacity ?? 1,
            });
            currentY -= lineHeight;
        }
    }

    // Save and return the final PDF
    return pdfDoc.save();
}

/**
 * Filter annotations to get only FreeText annotations with custom fonts
 */
export function getCustomFontAnnotations(annotations: PdfAnnotationObject[]): PdfFreeTextAnnoObject[] {
    return annotations.filter((anno): anno is PdfFreeTextAnnoObject => {
        if (!isFreeTextAnnotation(anno)) {
            return false;
        }
        const fontRef = anno.fontFamily as PdfFontRef;
        return isCustomFontRef(fontRef);
    });
}

/**
 * Check if any annotations require custom font embedding
 */
export function hasCustomFontAnnotations(annotations: PdfAnnotationObject[]): boolean {
    return getCustomFontAnnotations(annotations).length > 0;
}
