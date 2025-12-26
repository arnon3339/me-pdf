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

interface FreeTextFontPanelProps {
    documentId: string;
    isVisible: boolean;
    onClose: () => void;
}

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36, 48, 72];
const colorPresets = [
    '#000000', '#374151', '#DC2626', '#EA580C', '#CA8A04',
    '#16A34A', '#0284C7', '#7C3AED', '#DB2777', '#FFFFFF',
];

export function FreeTextFontPanel({ documentId, isVisible, onClose }: FreeTextFontPanelProps) {
    const { provides: annotationCapability } = useAnnotationCapability();

    const [selectedFont, setSelectedFont] = useState<PdfFontRef>(
        createStandardFontRef(PdfStandardFont.Helvetica),
    );
    const [fontSize, setFontSize] = useState(12);
    const [fontColor, setFontColor] = useState('#000000');

    // Update annotation tool defaults when font changes
    useEffect(() => {
        if (!annotationCapability) return;

        // Always update fontFamily - PdfFontRef supports both standard and custom fonts
        annotationCapability.setToolDefaults('freeText', {
            fontFamily: selectedFont,
        });
    }, [selectedFont, annotationCapability]);

    const handleFontSizeChange = (size: number) => {
        setFontSize(size);
        if (annotationCapability) {
            annotationCapability.setToolDefaults('freeText', { fontSize: size });
        }
    };

    const handleColorChange = (color: string) => {
        setFontColor(color);
        if (annotationCapability) {
            annotationCapability.setToolDefaults('freeText', { fontColor: color });
        }
    };

    if (!isVisible) return null;

    const hasCustomFont = selectedFont.type === 'custom';
    const customFontName = hasCustomFont ? selectedFont.fullName : '';

    return (
        <div className="absolute right-4 top-16 z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Text Settings</h3>
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
                <label className="mb-1 block text-xs font-medium text-gray-600">Font Size</label>
                <select
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                    {fontSizes.map((size) => (
                        <option key={size} value={size}>
                            {size}pt
                        </option>
                    ))}
                </select>
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
