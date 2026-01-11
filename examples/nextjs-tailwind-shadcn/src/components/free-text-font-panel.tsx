/**
 * FreeTextFontPanel Component
 *
 * A floating panel for configuring FreeText annotation text settings:
 * font family, size, and color.
 */
import { useState, useEffect } from 'react';
import { FontSelector } from './font-selector';
import {
    PdfStandardFont,
    type PdfFontRef,
    createStandardFontRef,
} from '@embedpdf/models';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import { Slider } from './ui/slider';

interface FreeTextFontPanelProps {
    documentId: string;
    isVisible: boolean;
    onClose: () => void;
}

const colorPresets = [
    '#000000', '#374151', '#DC2626', '#EA580C', '#CA8A04',
    '#16A34A', '#0284C7', '#7C3AED', '#DB2777', '#FFFFFF',
];

export function FreeTextFontPanel({ documentId, isVisible, onClose }: FreeTextFontPanelProps) {
    const { provides: annotationCapability } = useAnnotationCapability();

    // Local state for the panel UI
    const [selectedFont, setSelectedFont] = useState<PdfFontRef>(
        createStandardFontRef(PdfStandardFont.Helvetica),
    );
    const [fontSize, setFontSize] = useState(12);
    const [fontColor, setFontColor] = useState('#000000');

    // Track the currently selected annotation
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

    // Subscribe to selection changes and sync state
    useEffect(() => {
        if (!annotationCapability) return;

        const scope = annotationCapability.forDocument(documentId);

        // Initial check
        const initialDetails = getSelectedTextAnnotationDetails(scope);
        if (initialDetails) {
            setSelectedAnnotationId(initialDetails.id);
            if (initialDetails.fontFamily) setSelectedFont(initialDetails.fontFamily);
            if (initialDetails.fontSize) setFontSize(initialDetails.fontSize);
            if (initialDetails.fontColor) setFontColor(initialDetails.fontColor);
        }

        // Listen for changes
        return scope.onStateChange((state) => {
            const selectedUid = state.selectedUid;

            // If nothing selected or selection changed
            if (selectedUid !== selectedAnnotationId) {
                if (!selectedUid) {
                    setSelectedAnnotationId(null);
                    // Optionally reset to defaults or keep last used? 
                    // Let's keep last used to avoid jarring UI changes unless we want to "reset" mode.
                    // Actually, if we deselect, we should probably go back to tool defaults.
                    const tool = annotationCapability.getTool('freeText');
                    if (tool) {
                        const defaults = tool.defaults as any;
                        if (defaults.fontFamily) setSelectedFont(defaults.fontFamily);
                        if (defaults.fontSize) setFontSize(defaults.fontSize);
                        if (defaults.fontColor) setFontColor(defaults.fontColor);
                        else if (defaults.color) setFontColor(defaults.color);
                    }
                } else {
                    // Check if it's a freetext annotation
                    const tracked = state.byUid[selectedUid];
                    if (tracked && (tracked.object as any).subtype === 'FreeText') {
                        setSelectedAnnotationId(selectedUid);
                        const anno = tracked.object as any;
                        if (anno.fontFamily) setSelectedFont(anno.fontFamily);
                        if (anno.fontSize) setFontSize(anno.fontSize);
                        if (anno.fontColor) setFontColor(anno.fontColor);
                        else if (anno.color) setFontColor(anno.color);
                    } else {
                        setSelectedAnnotationId(null);
                    }
                }
            }
        });
    }, [annotationCapability, documentId]); // Remove selectedAnnotationId dependency to avoid loops, handle in callback logic

    // Update annotation or tool defaults when font changes
    useEffect(() => {
        if (!annotationCapability) return;

        const scope = annotationCapability.forDocument(documentId);

        if (selectedAnnotationId) {
            // We are in selection mode, getting the annotation to check its pageIndex
            const tracked = scope.getAnnotationById(selectedAnnotationId);
            if (tracked && tracked.object) {
                scope.updateAnnotation(tracked.object.pageIndex, selectedAnnotationId, {
                    fontFamily: selectedFont
                } as any);
            }
        } else {
            // No selection, update defaults for next creation
            annotationCapability.setToolDefaults('freeText', {
                fontFamily: selectedFont,
            });
        }
    }, [selectedFont, annotationCapability, documentId, selectedAnnotationId]);

    const handleFontSizeChange = (size: number) => {
        setFontSize(size);
        if (!annotationCapability) return;

        if (selectedAnnotationId) {
            const scope = annotationCapability.forDocument(documentId);
            const tracked = scope.getAnnotationById(selectedAnnotationId);
            if (tracked && tracked.object) {
                scope.updateAnnotation(tracked.object.pageIndex, selectedAnnotationId, {
                    fontSize: size
                } as any);
            }
        } else {
            annotationCapability.setToolDefaults('freeText', { fontSize: size });
        }
    };

    const handleColorChange = (color: string) => {
        setFontColor(color);
        if (!annotationCapability) return;

        if (selectedAnnotationId) {
            const scope = annotationCapability.forDocument(documentId);
            const tracked = scope.getAnnotationById(selectedAnnotationId);
            if (tracked && tracked.object) {
                // IMPORTANT: Update both fontColor and color to ensure compatibility
                // and immediate re-render of the FreeText component.
                scope.updateAnnotation(tracked.object.pageIndex, selectedAnnotationId, {
                    fontColor: color,
                    color: color
                } as any);
            }
        } else {
            // Update tool defaults for next annotation
            annotationCapability.setToolDefaults('freeText', {
                fontColor: color,
                color: color
            });
        }
    };

    if (!isVisible) return null;

    const hasCustomFont = selectedFont.type === 'custom';
    const customFontName = hasCustomFont ? selectedFont.fullName : '';

    return (
        <div className="absolute right-4 top-16 z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                    {selectedAnnotationId ? 'Edit Text' : 'Text Settings'}
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close"
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            {/* Font Family */}
            <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-600">Font Family</label>
                <FontSelector value={selectedFont} onChange={setSelectedFont} />
            </div>

            {/* Font Size */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Font Size</span>
                    <span className="text-xs text-muted-foreground">{fontSize}px</span>
                </div>
                <Slider
                    value={[fontSize]}
                    onValueChange={(vals) => handleFontSizeChange(vals[0] ?? fontSize)}
                    color={fontColor === '#FFFFFF' ? '#9CA3AF' : fontColor}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full h-8"
                />
            </div>

            {/* Font Color */}
            <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-600">Font Color</label>
                <div className="flex flex-wrap gap-2">
                    {colorPresets.map((color) => (
                        <button
                            key={color}
                            className={`h-6 w-6 rounded border-2 transition-all ${fontColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                                }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorChange(color)}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            {/* Info about custom fonts */}
            {hasCustomFont && (
                <div className="mt-4 rounded bg-blue-50 p-2 text-xs text-blue-700">
                    <strong>Custom Font:</strong> {customFontName}
                    <br />
                    <span className="text-blue-600">
                        This font will be embedded in the PDF when exporting.
                    </span>
                </div>
            )}
        </div>
    );
}

// Helper to get selected annotation details safely
function getSelectedTextAnnotationDetails(scope: any) {
    const tracked = scope.getSelectedAnnotation();
    // Safely check subtype
    if (tracked && (tracked.object as any).subtype === 'FreeText') {
        return {
            id: tracked.object.id,
            fontFamily: (tracked.object as any).fontFamily,
            fontSize: (tracked.object as any).fontSize,
            fontColor: (tracked.object as any).fontColor || tracked.object.color,
        };
    }
    return null;
}
