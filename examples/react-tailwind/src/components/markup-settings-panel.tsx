/**
 * MarkupSettingsPanel Component
 *
 * A floating panel for configuring text markup annotation settings:
 * highlight, underline, strikethrough, squiggly - mainly just color.
 */
import { useState, useEffect } from 'react';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import { Slider } from "@/components/ui/slider"

interface MarkupSettingsPanelProps {
    isVisible: boolean;
    toolId: string;
    onClose: () => void;
}

const colorPresets = [
    '#FFCD45', '#FFA500', '#FF6B6B', '#E44234', '#DC2626',
    '#16A34A', '#0284C7', '#7C3AED', '#000000', '#FFFFFF',
];



export function MarkupSettingsPanel({ isVisible, toolId, onClose }: MarkupSettingsPanelProps) {
    const { provides: annotationCapability } = useAnnotationCapability();

    const [color, setColor] = useState('#FFCD45');
    const [strokeWidth, setStrokeWidth] = useState(2);

    // Initialize from tool defaults if available
    useEffect(() => {
        if (!annotationCapability || !toolId) return;
        const tool = annotationCapability.getTool(toolId);
        if (tool && tool.defaults) {
            const defaults = tool.defaults as any;
            if (defaults.color) setColor(defaults.color);
            if (defaults.strokeWidth) setStrokeWidth(defaults.strokeWidth);
        }
    }, [annotationCapability, toolId]);

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        if (annotationCapability && toolId) {
            annotationCapability.setToolDefaults(toolId, { color: newColor });
        }
    };

    const handleStrokeWidthChange = (width: number) => {
        setStrokeWidth(width);
        if (annotationCapability && toolId) {
            annotationCapability.setToolDefaults(toolId, { strokeWidth: width });
        }
    };

    if (!isVisible) return null;

    // Get display name based on tool ID
    const toolNames: Record<string, string> = {
        highlight: 'Highlight',
        underline: 'Underline',
        strikeout: 'Strikethrough',
        squiggly: 'Squiggly',
    };
    const displayName = toolNames[toolId] || 'Markup';

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

            {/* Stroke Width (only for underline and strikeout) */}
            {(toolId === 'underline' ||
                toolId === 'strikeout' ||
                toolId === 'squiggly') && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">Line Thickness</span>
                            <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
                        </div>
                        <Slider
                            value={[strokeWidth]}
                            onValueChange={(vals) => handleStrokeWidthChange(vals[0] ?? strokeWidth)}
                            color={color === '#FFFFFF' ? '#9CA3AF' : color}
                            min={1}
                            max={20}
                            step={1}
                            className="w-full h-8"
                        />
                    </div>
                )}

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
