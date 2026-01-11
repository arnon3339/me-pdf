/**
 * ShapeSettingsPanel Component
 *
 * A floating panel for configuring shape annotation settings:
 * stroke width, stroke color, and fill color.
 */
import { useState, useEffect } from 'react';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import { Slider } from './ui/slider';

interface ShapeSettingsPanelProps {
    isVisible: boolean;
    toolId: string;
    onClose: () => void;
}

const strokeWidths = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const colorPresets = [
    '#000000', '#374151', '#DC2626', '#EA580C', '#CA8A04',
    '#16A34A', '#0284C7', '#7C3AED', '#DB2777', '#FFFFFF',
];

export function ShapeSettingsPanel({ isVisible, toolId, onClose }: ShapeSettingsPanelProps) {
    const { provides: annotationCapability } = useAnnotationCapability();

    const [strokeWidth, setStrokeWidth] = useState(2);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [fillColor, setFillColor] = useState('transparent');

    // Initialize from tool defaults if available
    useEffect(() => {
        if (!annotationCapability || !toolId) return;
        const tool = annotationCapability.getTool(toolId);
        if (tool && tool.defaults) {
            const defaults = tool.defaults as any;
            if (defaults.strokeWidth) setStrokeWidth(defaults.strokeWidth);
            if (defaults.strokeColor) setStrokeColor(defaults.strokeColor);
            if (defaults.color) setFillColor(defaults.color);
        }
    }, [annotationCapability, toolId]);

    const handleStrokeWidthChange = (width: number) => {
        setStrokeWidth(width);
        if (annotationCapability && toolId) {
            annotationCapability.setToolDefaults(toolId, { strokeWidth: width });
        }
    };

    const handleStrokeColorChange = (color: string) => {
        setStrokeColor(color);
        if (annotationCapability && toolId) {
            annotationCapability.setToolDefaults(toolId, { strokeColor: color });
        }
    };

    const handleFillColorChange = (color: string) => {
        setFillColor(color);
        if (annotationCapability && toolId) {
            annotationCapability.setToolDefaults(toolId, { color: color });
        }
    };

    if (!isVisible) return null;

    return (
        <div className="absolute right-4 top-16 z-50 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Shape Settings</h3>
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
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Stroke Width</label>
                    <span className="text-xs text-gray-600">{strokeWidth}</span>
                </div>

                <Slider
                    value={[strokeWidth]}
                    onValueChange={(values) => handleStrokeWidthChange(values[0])}
                    min={1}
                    max={36}
                    step={1}
                    className="w-full"
                />
            </div>

            {/* Stroke Color */}
            <div className="mb-4">
                <label className="mb-2 block text-xs font-medium text-gray-600">
                    Stroke Color
                </label>
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => handleStrokeColorChange('transparent')}
                        className={`flex h-6 w-6 items-center justify-center rounded border-2 text-xs transition-transform hover:scale-110 ${strokeColor === 'transparent' ? 'border-blue-500' : 'border-gray-200'
                            }`}
                        title="Transparent"
                    >
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="4" y1="4" x2="20" y2="20" />
                        </svg>
                    </button>
                    {colorPresets.map((color) => (
                        <button
                            key={`stroke-${color}`}
                            onClick={() => handleStrokeColorChange(color)}
                            className={`h-6 w-6 rounded border-2 transition-transform hover:scale-110 ${strokeColor === color ? 'border-blue-500' : 'border-gray-200'
                                }`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            {/* Fill Color */}
            <div className="mb-2">
                <label className="mb-2 block text-xs font-medium text-gray-600">
                    Fill Color
                </label>
                <div className="flex flex-wrap gap-1">
                    <button
                        onClick={() => handleFillColorChange('transparent')}
                        className={`flex h-6 w-6 items-center justify-center rounded border-2 text-xs transition-transform hover:scale-110 ${fillColor === 'transparent' ? 'border-blue-500' : 'border-gray-200'
                            }`}
                        title="Transparent"
                    >
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="4" y1="4" x2="20" y2="20" />
                        </svg>
                    </button>
                    {colorPresets.map((color) => (
                        <button
                            key={`fill-${color}`}
                            onClick={() => handleFillColorChange(color)}
                            className={`h-6 w-6 rounded border-2 transition-transform hover:scale-110 ${fillColor === color ? 'border-blue-500' : 'border-gray-200'
                                }`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
