/**
 * FontSelector Component
 *
 * A dropdown select component for choosing between standard PDF fonts
 * and local fonts (via Local Font Access API).
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PdfStandardFont,
    PdfStandardFontFamily,
    STANDARD_FONT_FAMILIES,
    standardFontFamilyLabel,
    type PdfFontRef,
    createStandardFontRef,
    createCustomFontRef,
    fontRefToCss,
} from '@embedpdf/models';
import {
    isLocalFontAccessSupported,
    queryLocalFonts,
    groupFontsByFamily,
    loadFontData,
    type LocalFont,
} from '@embedpdf/plugin-font';
import { fontDataStore } from '../utils/font-data-store';
import { Bold, Italic } from "lucide-react";

interface FontSelectorProps {
    value: PdfFontRef;
    onChange: (font: PdfFontRef) => void;
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
    const [localFonts, setLocalFonts] = useState<LocalFont[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [supported, setSupported] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');

    // Custom Font State
    const [customFamily, setCustomFamily] = useState<string>('');
    const [customWeight, setCustomWeight] = useState<number>(400);
    const [isItalic, setIsItalic] = useState<boolean>(false);

    useEffect(() => {
        setSupported(isLocalFontAccessSupported());
    }, []);

    // Sync state with incoming value
    useEffect(() => {
        if (value.type === 'custom') {
            setActiveTab('custom');
            setCustomFamily(value.family || value.fullName); // Corrected from familyName

            // Try to deduce weight/style from the current font ref if possible, 
            // or find it in the loaded local fonts list to get exact metadata
            const knownFont = localFonts.find(f => f.postscriptName === value.postscriptName);
            if (knownFont) {
                setCustomFamily(knownFont.family);
                setCustomWeight(knownFont.weight || 400);
                setIsItalic(!!knownFont.italic);
            }
        }
    }, [value, localFonts]);

    const customFontFamilies = useMemo(() => {
        if (!hasPermission || localFonts.length === 0) return new Map<string, LocalFont[]>();
        return groupFontsByFamily(localFonts);
    }, [hasPermission, localFonts]);

    const standardFontOptions = useMemo(
        () =>
            STANDARD_FONT_FAMILIES.filter((f) => f !== PdfStandardFontFamily.Unknown).map((family) => ({
                type: 'standard' as const,
                family,
                label: standardFontFamilyLabel(family),
            })),
        [],
    );

    const currentLabel = useMemo(() => {
        if (value.type === 'custom') {
            return value.fullName; // Display full name
        }
        return standardFontFamilyLabel(
            value.font >= 0 && value.font <= 3
                ? PdfStandardFontFamily.Courier
                : value.font >= 4 && value.font <= 7
                    ? PdfStandardFontFamily.Helvetica
                    : PdfStandardFontFamily.Times,
        );
    }, [value]);

    const selectStandardFont = (family: PdfStandardFontFamily) => {
        let font: PdfStandardFont;
        switch (family) {
            case PdfStandardFontFamily.Courier: font = PdfStandardFont.Courier; break;
            case PdfStandardFontFamily.Helvetica: font = PdfStandardFont.Helvetica; break;
            case PdfStandardFontFamily.Times: font = PdfStandardFont.Times_Roman; break;
            case PdfStandardFontFamily.Symbol: font = PdfStandardFont.Symbol; break;
            case PdfStandardFontFamily.ZapfDingbats: font = PdfStandardFont.ZapfDingbats; break;
            default: font = PdfStandardFont.Helvetica;
        }
        onChange(createStandardFontRef(font));
        setIsOpen(false);
    };

    const selectCustomFont = useCallback(async (font: LocalFont) => {
        setIsLoading(true);
        try {
            const loadedFont = await loadFontData(font.postscriptName);
            if (loadedFont && loadedFont.data) {
                // Infer weight if missing
                let weight = String(font.weight || 400);
                if (!font.weight) {
                    const lowerStyle = (font.style || '').toLowerCase();
                    if (lowerStyle.includes('bold')) weight = '700';
                    else if (lowerStyle.includes('semibold') || lowerStyle.includes('semi-bold') || lowerStyle.includes('demi')) weight = '600';
                    else if (lowerStyle.includes('light')) weight = '300';
                    else if (lowerStyle.includes('medium')) weight = '500';
                    else if (lowerStyle.includes('black') || lowerStyle.includes('heavy')) weight = '900';
                }

                const fontFace = new FontFace(font.family, loadedFont.data, {
                    weight,
                    style: font.italic ? 'italic' : 'normal',
                });
                await fontFace.load();
                document.fonts.add(fontFace);

                fontDataStore.set(font.postscriptName, {
                    postscriptName: font.postscriptName,
                    familyName: font.family,
                    fullName: font.fullName,
                    data: loadedFont.data,
                });
            }
        } catch (error) {
            console.error('Failed to load font:', error);
        } finally {
            setIsLoading(false);
        }
        onChange(createCustomFontRef(font.postscriptName, font.family, font.fullName, font.style));
        // Keep panel open to adjust weight/style if they just clicked family
    }, [onChange]);

    const handleCustomFamilyChange = (familyName: string) => {
        setCustomFamily(familyName);
        // Default to Regular (400) non-italic, or closest available
        const variants = customFontFamilies.get(familyName) || [];
        const bestMatch = findBestMatch(variants, 400, false);
        if (bestMatch) {
            setCustomWeight(bestMatch.weight || 400);
            setIsItalic(!!bestMatch.italic);
            selectCustomFont(bestMatch);
        }
    };

    const handleVariantChange = (newWeight: number, newItalic: boolean) => {
        setCustomWeight(newWeight);
        setIsItalic(newItalic);

        const variants = customFontFamilies.get(customFamily) || [];
        const bestMatch = findBestMatch(variants, newWeight, newItalic);
        if (bestMatch) {
            selectCustomFont(bestMatch);
        }
    };

    const findBestMatch = (variants: LocalFont[], targetWeight: number, targetItalic: boolean) => {
        // Exact match
        let match = variants.find(v => (v.weight === targetWeight || (!v.weight && targetWeight === 400)) && !!v.italic === targetItalic);
        if (match) return match;

        // Relax weight
        match = variants.find(v => !!v.italic === targetItalic && Math.abs((v.weight || 400) - targetWeight) < 100);
        if (match) return match;

        // Fallback to anything
        return variants[0];
    }

    const handleRequestAccess = async () => {
        if (!supported) return;
        setIsLoading(true);
        try {
            const fonts = await queryLocalFonts();
            setLocalFonts(fonts);
            setHasPermission(true);
            setActiveTab('custom');
        } catch (error) {
            console.error('Font access denied:', error);
            setHasPermission(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare options for the UI
    const sortedFamilies = Array.from(customFontFamilies.keys()).sort();
    const currentFamilyVariants = customFontFamilies.get(customFamily) || [];
    const availableWeights = Array.from(new Set(currentFamilyVariants.map(v => v.weight || 400))).sort((a, b) => a - b);
    const hasItalic = currentFamilyVariants.some(v => v.italic);

    return (
        <div className="relative inline-block w-full">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ fontFamily: fontRefToCss(value) }}>{currentLabel}</span>
                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full max-w-md rounded border border-gray-200 bg-white shadow-lg">
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'standard' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                            onClick={() => setActiveTab('standard')}
                        >
                            Standard Fonts
                        </button>
                        <button
                            className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'custom' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                            onClick={() => setActiveTab('custom')}
                        >
                            Local Fonts
                        </button>
                    </div>

                    {activeTab === 'standard' && (
                        <div className="max-h-60 overflow-y-auto p-2">
                            {standardFontOptions.map((opt) => (
                                <button
                                    key={opt.family}
                                    className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
                                    onClick={() => selectStandardFont(opt.family)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'custom' && (
                        <div className="p-2">
                            {(!supported || !hasPermission) ? (
                                <div className="p-2">
                                    {!supported ? (
                                        <p className="text-sm text-gray-500">Local Font Access is not supported.</p>
                                    ) : (
                                        <button
                                            className="w-full rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                                            disabled={isLoading}
                                            onClick={handleRequestAccess}
                                        >
                                            {isLoading ? 'Requesting...' : 'Allow Access to Local Fonts'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Family Selector */}
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500">Family</label>
                                        <select
                                            className="w-full rounded border border-gray-300 p-1 text-sm"
                                            value={customFamily}
                                            onChange={(e) => handleCustomFamilyChange(e.target.value)}
                                            size={5}
                                        >
                                            {sortedFamilies.map(fam => (
                                                <option key={fam} value={fam}>{fam}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Weight & Style Selectors (Only if family selected) */}
                                    {customFamily && (
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Weight</label>
                                                <select
                                                    className="w-full rounded border border-gray-300 p-1 text-sm"
                                                    value={customWeight}
                                                    onChange={(e) => handleVariantChange(Number(e.target.value), isItalic)}
                                                >
                                                    {availableWeights.map(w => (
                                                        <option key={w} value={w}>{w === 400 ? 'Regular' : w === 700 ? 'Bold' : w}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-center">
                                                <label className="flex cursor-pointer items-center gap-2 pt-4">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={isItalic}
                                                        onChange={(e) => handleVariantChange(customWeight, e.target.checked)}
                                                        disabled={!hasItalic}
                                                    />
                                                    <span className="text-sm">Italic</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
        </div>
    );
}
