/**
 * ExportButton Component
 * 
 * A button that exports the current PDF with custom fonts embedded.
 * Uses pdf-lib to embed custom fonts that were selected by the user.
 */
import { useState } from 'react';
import { useExportCapability } from '@embedpdf/plugin-export/react';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import { exportPdfWithCustomFonts } from '../utils/pdf-export';
import { fontDataStore } from '../utils/font-data-store';
import type { PdfAnnotationObject } from '@embedpdf/models';

interface ExportButtonProps {
    documentId: string;
    className?: string;
}

export function ExportButton({ documentId, className = '' }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { provides: exportCapability } = useExportCapability();
    const { provides: annotationCapability } = useAnnotationCapability();

    const handleExport = async () => {
        if (!exportCapability || !annotationCapability) {
            console.error('Export or annotation capability not available');
            return;
        }

        setIsExporting(true);

        try {
            // Get all annotations from state
            const state = annotationCapability.getState();
            console.log('[Export Debug] Raw annotation state:', JSON.stringify(state, null, 2));

            const allAnnotations: PdfAnnotationObject[] = [];
            const customFontAnnotations: PdfAnnotationObject[] = [];

            // Collect annotations from byUid (the actual annotation data)
            if (state.byUid) {
                for (const tracked of Object.values(state.byUid) as any[]) {
                    if (tracked && tracked.object) {
                        const anno = tracked.object as PdfAnnotationObject;
                        allAnnotations.push(anno);

                        // Check if this annotation has a custom font (FreeText annotations)
                        const fontRef = (anno as any).fontFamily;
                        if (fontRef && fontRef.type === 'custom') {
                            console.log('[Export Debug] Custom font annotation found:', {
                                id: anno.id,
                                type: anno.type,
                                fontRef,
                                contents: (anno as any).contents,
                            });
                            customFontAnnotations.push(anno);
                        }
                    }
                }
            }

            console.log('[Export Debug] Total annotations:', allAnnotations.length);
            console.log('[Export Debug] Custom font annotations:', customFontAnnotations.length);

            const hasCustomFonts = customFontAnnotations.length > 0;

            // For custom font annotations, delete them from PDFium before export
            // This prevents PDFium from rendering them with Helvetica fallback
            // pdf-lib will add them with the correct custom font
            if (hasCustomFonts) {
                console.log('[Export Debug] Removing custom font annotations from PDFium...');
                for (const anno of customFontAnnotations) {
                    // Delete the annotation from PDFium's internal state
                    // This uses the engine's removePageAnnotation internally
                    annotationCapability.forDocument(documentId).deleteAnnotation(anno.pageIndex, anno.id);
                }

                // Wait a bit for the deletion to process
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Export the base PDF using PDFium (now without custom font annotations)
            const exportTask = exportCapability.forDocument(documentId).saveAsCopy();
            const basePdfBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
                exportTask.wait(resolve, reject);
            });

            console.log('[Export Debug] Base PDF exported, size:', basePdfBytes.byteLength);

            let finalPdfBytes: Uint8Array;

            if (hasCustomFonts) {
                // Get font data from the store
                const fontDataMap = fontDataStore.getAll();
                console.log('[Export Debug] Font data store entries:', fontDataMap.size);
                for (const [key, value] of fontDataMap) {
                    console.log('[Export Debug] Font in store:', key, 'size:', value.byteLength);
                }

                // Use pdf-lib to add custom font annotations with proper fonts
                finalPdfBytes = await exportPdfWithCustomFonts(
                    new Uint8Array(basePdfBytes),
                    customFontAnnotations,
                    fontDataMap
                );

                // Re-import the deleted annotations back to the state
                // so they're visible in the UI again
                console.log('[Export Debug] Re-importing custom font annotations to state...');
                const annoScope = annotationCapability.forDocument(documentId);
                for (const anno of customFontAnnotations) {
                    annoScope.importAnnotations([{ annotation: anno }]);
                }
            } else {
                // No custom fonts, use the base export directly
                finalPdfBytes = new Uint8Array(basePdfBytes);
            }

            // Create download link
            const blob = new Blob([finalPdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `export-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {isExporting ? (
                <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Exporting...
                </>
            ) : (
                <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                </>
            )}
        </button>
    );
}
