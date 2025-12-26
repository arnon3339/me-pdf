/**
 * InkSettingsPanel Component
 *
 * A floating panel for configuring freehand drawing (ink) annotation settings:
 * stroke width and color.
 */
import { useState, useEffect } from 'react';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/react';

interface InkSettingsPanelProps {
    isVisible: boolean;
    toolId: string;
    onClose: () => void;
}

const strokeWidths = [2, 4, 6, 8, 10, 12, 14, 16];
const colorPresets = [
    '#000000', '#374151', '#DC2626', '#EA580C', '#CA8A04',
    '#16A34A', '#0284C7', '#7C3AED', '#DB2777', '#FFFFFF',
];

export function InkSettingsPanel({ isVisible, toolId, onClose }: InkSettingsPanelProps) {
    const { provides: annotationCapability } = useAnnotationCapability();

    const [strokeWidth, setStrokeWidth] = useState(6);
    const [color, setColor] = useState('#E44234');

    // Initialize from tool defaults if available
    useEffect(() => {
        if (!annotationCapability || !toolId) return;
        const tool = annotationCapability.getTool(toolId);
        if (tool && tool.defaults) {
            const defaults = tool.defaults as any;
            if (defaults.strokeWidth) setStrokeWidth(defaults.strokeWidth);
            if (defaults.color) setColor(defaults.color);
        }
    }, [annotationCapability, toolId]);

    const handleStrokeWidthChange = (width: number) => {
        setStrokeWidth(width);
        if (annotationCapability && toolId) {
            annotationCapability.setToolDefaults(toolId, { strokeWidth: width });
        }
    };

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        if (annotationCapability && toolId) {
            annotationCapability.setToolDefaults(toolId, { color: newColor });
        }
    };

    if (!isVisible) return null;

    // Get display name based on tool ID
    const toolNames: Record<string, string> = {
        ink: 'Pen',
        inkHighlighter: 'Highlighter',
    };
    const displayName = toolNames[toolId] || 'Drawing';

    return (
        <div className="absolute right-4 top-16 z-50 w-56 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{displayName} Settings</h3>
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

            {/* Stroke Width */}
            <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-gray-600">
                    Stroke Width
                </label>
                <div className="flex flex-wrap gap-1">
                    {strokeWidths.map((width) => (
                        <button
                            key={width}
                            onClick={() => handleStrokeWidthChange(width)}
                            className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-medium transition-colors ${strokeWidth === width
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {width}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color */}
            <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                    Color
                </label>
                <div className="flex flex-wrap gap-1">
                    {colorPresets.map((presetColor) => (
                        <button
                            key={presetColor}
                            onClick={() => handleColorChange(presetColor)}
                            className={`h-7 w-7 rounded border-2 transition-transform hover:scale-110 ${color === presetColor ? 'border-blue-500' : 'border-gray-200'
                                }`}
                            style={{ backgroundColor: presetColor }}
                            title={presetColor}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
