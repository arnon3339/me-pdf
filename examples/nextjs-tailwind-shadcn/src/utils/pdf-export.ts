import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
    PdfFreeTextAnnoObject,
    PdfAnnotationObject,
    PdfUnderlineAnnoObject,
    PdfStrikeOutAnnoObject,
    PdfSquigglyAnnoObject,
    PdfAnnotationSubtype,
    isStandardFontRef,
    isCustomFontRef,
    PdfFontRef
} from '@embedpdf/models';

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
    return anno.type === PdfAnnotationSubtype.FREETEXT;
}

/**
 * Check if an annotation is an Underline annotation
 */
function isUnderlineAnnotation(anno: PdfAnnotationObject): anno is PdfUnderlineAnnoObject {
    return anno.type === PdfAnnotationSubtype.UNDERLINE;
}

/**
 * Check if an annotation is a Strikeout annotation
 */
function isStrikeOutAnnotation(anno: PdfAnnotationObject): anno is PdfStrikeOutAnnoObject {
    return anno.type === PdfAnnotationSubtype.STRIKEOUT;
}

/**
 * Check if an annotation is a Squiggly annotation
 */
function isSquigglyAnnotation(anno: PdfAnnotationObject): anno is PdfSquigglyAnnoObject {
    return anno.type === PdfAnnotationSubtype.SQUIGGLY;
}

/**
 * Export a PDF with custom elements processed using pdf-lib.
 * 
 * This function takes a base PDF (exported from PDFium) and overlays:
 * 1. FreeText annotations that use custom fonts
 * 2. Underline annotations (to ensure correct stroke width)
 * 3. Strikeout annotations (to ensure correct stroke width)
 * 4. Squiggly annotations (to ensure correct stroke width)
 * 
 * @param basePdfBytes - The base PDF bytes from PDFium export
 * @param annotations - Annotations to process manually
 * @param fontDataMap - Map of font postscript names to TTF/OTF byte data
 * @returns Promise<Uint8Array> - The final PDF
 */
export async function exportPdfWithCustomAnnotations(
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

    // Process each annotation
    console.log('[pdf-lib Export] Processing', annotations.length, 'custom annotations');

    for (const anno of annotations) {
        const pages = pdfDoc.getPages();
        if (anno.pageIndex < 0 || anno.pageIndex >= pages.length) {
            console.warn(`Invalid page index: ${anno.pageIndex}`);
            continue;
        }
        const page = pages[anno.pageIndex];
        const pageHeight = page.getHeight();

        if (isFreeTextAnnotation(anno)) {
            const fontRef = anno.fontFamily as PdfFontRef;

            // Skip standard fonts if passed here by mistake (though caller should filter)
            if (isStandardFontRef(fontRef)) continue;

            // Need custom font data
            if (!isCustomFontRef(fontRef)) continue;

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

            // Calculate position in PDF coordinates (origin at bottom-left)
            const x = anno.rect.origin.x;
            const y = pageHeight - anno.rect.origin.y - anno.rect.size.height;

            // Parse the font color
            const color = parseHexColor(anno.fontColor || '#000000');

            // Get the text content
            const text = anno.contents || '';
            if (!text) continue;

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
        else if (isUnderlineAnnotation(anno)) {
            // Validate segments
            if (!anno.segmentRects || anno.segmentRects.length === 0) continue;

            const color = parseHexColor(anno.color || '#FFFF00');
            const strokeWidth = anno.strokeWidth || 1;
            const opacity = anno.opacity ?? 1;

            // Draw each segment
            for (const r of anno.segmentRects) {
                const x = r.origin.x;
                const y = pageHeight - r.origin.y - r.size.height;

                page.drawRectangle({
                    x,
                    y,
                    width: r.size.width,
                    height: strokeWidth,
                    color: rgb(color.r, color.g, color.b),
                    opacity,
                });
            }
        }
        else if (isStrikeOutAnnotation(anno)) {
            // Validate segments
            if (!anno.segmentRects || anno.segmentRects.length === 0) continue;

            const color = parseHexColor(anno.color || '#FFFF00');
            const strokeWidth = anno.strokeWidth || 1;
            const opacity = anno.opacity ?? 1;

            // Draw each segment
            for (const r of anno.segmentRects) {
                const rectBottomY = pageHeight - r.origin.y - r.size.height;
                const midY = rectBottomY + (r.size.height / 2);
                const y = midY - (strokeWidth / 2);
                const x = r.origin.x;

                page.drawRectangle({
                    x,
                    y,
                    width: r.size.width,
                    height: strokeWidth,
                    color: rgb(color.r, color.g, color.b),
                    opacity,
                });
            }
        }
        else if (isSquigglyAnnotation(anno)) {
            // Validate segments
            if (!anno.segmentRects || anno.segmentRects.length === 0) continue;

            const color = parseHexColor(anno.color || '#FFFF00');
            const strokeWidth = (anno as any).strokeWidth || 1;
            const opacity = anno.opacity ?? 1;

            // Period for the wave (wavelength), matching viewer default of 6px
            const period = 6;
            // Amplitude is roughly the thickness/strokeWidth
            const amplitude = strokeWidth;

            // Draw each segment
            for (const r of anno.segmentRects) {
                const width = r.size.width;
                // PDF Y is from bottom. 
                const rectBottomY = pageHeight - r.origin.y - r.size.height;

                // Construct SVG Path
                let d = `M 0 ${amplitude}`;

                const cycles = Math.ceil(width / period);
                for (let i = 0; i < cycles; i++) {
                    // Relative quadratic curves to create sine wave pattern
                    // q dx1 dy1, dx dy
                    d += ` q ${period / 4} -${amplitude} ${period / 2} 0 t ${period / 2} 0`;
                }

                // Draw the path
                page.drawSvgPath(d, {
                    x: r.origin.x,
                    y: rectBottomY,
                    borderColor: rgb(color.r, color.g, color.b),
                    color: undefined, // Ensure no fill
                    borderOpacity: opacity,
                    borderWidth: strokeWidth,
                });
            }
        }
    }

    // Save and return the final PDF
    return pdfDoc.save();
}

/**
 * Check if the annotation requires custom rendering via pdf-lib
 */
export function isCustomRenderAnnotation(anno: PdfAnnotationObject): boolean {
    // 1. FreeText with custom font
    if (isFreeTextAnnotation(anno)) {
        const fontRef = anno.fontFamily as PdfFontRef;
        return isCustomFontRef(fontRef);
    }
    // 2. Underline (to fix width issue)
    if (isUnderlineAnnotation(anno)) {
        return true;
    }
    // 3. Strikeout (to fix width issue)
    if (isStrikeOutAnnotation(anno)) {
        return true;
    }
    // 4. Squiggly (to fix width issue)
    if (isSquigglyAnnotation(anno)) {
        return true;
    }
    return false;
}

/**
 * Filter annotations to get only those requiring custom rendering
 */
export function getCustomRenderAnnotations(annotations: PdfAnnotationObject[]): PdfAnnotationObject[] {
    return annotations.filter(isCustomRenderAnnotation);
}
