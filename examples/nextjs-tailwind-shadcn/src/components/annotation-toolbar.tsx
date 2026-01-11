import { AnnotationTool, useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import { useHistoryCapability } from '@embedpdf/plugin-history/react';
import { useTranslations } from '@embedpdf/plugin-i18n/react';
import { useEffect, useState, useMemo } from 'react';
import { ToolbarButton } from './ui';
import {
  HighlightIcon,
  UnderlineIcon,
  StrikethroughIcon,
  SquigglyIcon,
  PenIcon,
  TextIcon,
  CircleIcon,
  SquareIcon,
  PolygonIcon,
  PolylineIcon,
  LineIcon,
  ArrowIcon,
  UndoIcon,
  RedoIcon,
  SettingsIcon,
  ImageIcon,
} from './icons';
import { FreeTextFontPanel } from './free-text-font-panel';
import { ShapeSettingsPanel } from './shape-settings-panel';
import { MarkupSettingsPanel } from './markup-settings-panel';
import { InkSettingsPanel } from './ink-settings-panel';
import { ExportButton } from './export-button';

// Tool groups for showing different settings panels
const SHAPE_TOOLS = ['circle', 'square', 'polygon', 'polyline', 'line', 'lineArrow'];
const MARKUP_TOOLS = ['highlight', 'underline', 'strikeout', 'squiggly'];
const INK_TOOLS = ['ink', 'inkHighlighter'];

type AnnotationToolbarProps = {
  documentId: string;
};

// Helper type for tool colors
type ToolColors = Record<string, { primaryColor?: string; secondaryColor?: string }>;

// Helper function to extract tool colors
function extractToolColors(tools: AnnotationTool[]): ToolColors {
  const colors: ToolColors = {};
  tools.forEach((tool) => {
    const defaults = tool.defaults as any;
    colors[tool.id] = {
      primaryColor: defaults.strokeColor || defaults.color || defaults.fontColor,
      secondaryColor: defaults.color,
    };
  });
  return colors;
}

export function AnnotationToolbar({ documentId }: AnnotationToolbarProps) {
  const { provides: annotationCapability } = useAnnotationCapability();
  const { provides: historyCapability } = useHistoryCapability();
  const { translate: t, locale } = useTranslations(documentId);

  const [activeTool, setActiveTool] = useState<AnnotationTool | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [showShapePanel, setShowShapePanel] = useState(false);
  const [showMarkupPanel, setShowMarkupPanel] = useState(false);
  const [showInkPanel, setShowInkPanel] = useState(false);

  // Initialize tool colors synchronously to avoid flash
  const [toolColors, setToolColors] = useState<ToolColors>(() =>
    annotationCapability ? extractToolColors(annotationCapability.getTools()) : {},
  );

  // Get scoped API for this document
  const annotationProvides = useMemo(
    () => (annotationCapability ? annotationCapability.forDocument(documentId) : null),
    [annotationCapability, documentId],
  );

  // Get scoped history for this document
  const historyProvides = useMemo(
    () => (historyCapability ? historyCapability.forDocument(documentId) : null),
    [historyCapability, documentId],
  );

  // Subscribe to changes and selection updates
  useEffect(() => {
    if (!annotationProvides) return;

    // Initialize with current tool
    setActiveTool(annotationProvides.getActiveTool());

    const config = {
      // Subscribe to active tool changes
      unsubTool: annotationProvides.onActiveToolChange((tool) => {
        setActiveTool(tool);
        // Reset all panels first
        setShowFontPanel(false);
        setShowShapePanel(false);
        setShowMarkupPanel(false);
        setShowInkPanel(false);

        // Then show the appropriate panel based on tool
        if (tool?.id === 'freeText') {
          setShowFontPanel(true);
        } else if (tool && SHAPE_TOOLS.includes(tool.id)) {
          setShowShapePanel(true);
        } else if (tool && MARKUP_TOOLS.includes(tool.id)) {
          setShowMarkupPanel(true);
        } else if (tool && INK_TOOLS.includes(tool.id)) {
          setShowInkPanel(true);
        }
      }),

      // Subscribe to selection state changes
      unsubSelection: annotationProvides.onStateChange((state) => {
        const selectedUid = state.selectedUid;
        if (selectedUid) {
          const annotation = state.byUid[selectedUid];
          if (annotation && (annotation.object as any).subtype === 'FreeText') {
            setShowFontPanel(true);
            setShowShapePanel(false);
            setShowMarkupPanel(false);
            setShowInkPanel(false);
          }
        }
      })
    };

    return () => {
      config.unsubTool();
      config.unsubSelection();
    };
  }, [annotationProvides]);

  // Subscribe to tool changes to get tool defaults (only fires when tools are updated)
  useEffect(() => {
    if (!annotationCapability) return;

    // Subscribe to tool changes (only when tool defaults are updated)
    return annotationCapability.onToolsChange((event) => {
      setToolColors(extractToolColors(event.tools));
    });
  }, [annotationCapability]);

  // Subscribe to history state changes for this document
  useEffect(() => {
    if (!historyProvides) return;

    // Initialize with current state
    const state = historyProvides.getHistoryState();
    setCanUndo(state.global.canUndo);
    setCanRedo(state.global.canRedo);

    // Subscribe to history changes
    return historyProvides.onHistoryChange(() => {
      const newState = historyProvides.getHistoryState();
      setCanUndo(newState.global.canUndo);
      setCanRedo(newState.global.canRedo);
    });
  }, [historyProvides]);

  useEffect(() => {
    console.log('Current locale in AnnotationToolbar:', locale);
  }, [locale]);

  if (!annotationProvides) return null;

  const toggleTool = (toolId: string) => {
    const currentId = activeTool?.id ?? null;
    annotationProvides.setActiveTool(currentId === toolId ? null : toolId);
  };

  const handleUndo = () => {
    if (historyProvides) {
      historyProvides.undo();
    }
  };

  const handleRedo = () => {
    if (historyProvides) {
      historyProvides.redo();
    }
  };

  return (
    <div className="flex items-center gap-2 border-b border-gray-300 bg-white px-3 py-2">
      <ToolbarButton
        onClick={() => toggleTool('highlight')}
        isActive={activeTool?.id === 'highlight'}
        aria-label={t('annotation.highlight', { fallback: 'Highlight text' })}
        title={t('annotation.highlight', { fallback: 'Highlight Text' })}
      >
        <HighlightIcon className="h-4 w-4" style={{ color: toolColors.highlight?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('underline')}
        isActive={activeTool?.id === 'underline'}
        aria-label={t('annotation.underline', { fallback: 'Underline text' })}
        title={t('annotation.underline', { fallback: 'Underline' })}
      >
        <UnderlineIcon className="h-4 w-4" style={{ color: toolColors.underline?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('strikeout')}
        isActive={activeTool?.id === 'strikeout'}
        aria-label={t('annotation.strikeout', { fallback: 'Strikethrough text' })}
        title={t('annotation.strikeout', { fallback: 'Strikethrough' })}
      >
        <StrikethroughIcon
          className="h-4 w-4"
          style={{ color: toolColors.strikeout?.primaryColor }}
        />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('squiggly')}
        isActive={activeTool?.id === 'squiggly'}
        aria-label={t('annotation.squiggly', { fallback: 'Squiggly underline' })}
        title={t('annotation.squiggly', { fallback: 'Squiggly Underline' })}
      >
        <SquigglyIcon className="h-4 w-4" style={{ color: toolColors.squiggly?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('ink')}
        isActive={activeTool?.id === 'ink'}
        aria-label={t('annotation.ink', { fallback: 'Freehand annotation' })}
        title={t('annotation.ink', { fallback: 'Draw Freehand' })}
      >
        <PenIcon className="h-4 w-4" style={{ color: toolColors.ink?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('freeText')}
        isActive={activeTool?.id === 'freeText'}
        aria-label={t('annotation.text', { fallback: 'Text annotation' })}
        title={t('annotation.text', { fallback: 'Add Text Annotation' })}
      >
        <TextIcon className="h-4 w-4" style={{ color: toolColors.freeText?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('stamp')}
        isActive={activeTool?.id === 'stamp'}
        aria-label={t('annotation.image', { fallback: 'Image annotation' })}
        title={t('annotation.image', { fallback: 'Add Image' })}
      >
        <ImageIcon className="h-4 w-4" style={{ color: toolColors.stamp?.primaryColor }} />
      </ToolbarButton>

      {/* Font Settings button - visible when freeText tool is active OR panel is forced shown via selection */}
      {(activeTool?.id === 'freeText' || showFontPanel) && (
        <ToolbarButton
          onClick={() => setShowFontPanel(!showFontPanel)}
          isActive={showFontPanel}
          aria-label={t('annotation.fontSettings', { fallback: 'Font settings' })}
          title={t('annotation.fontSettings', { fallback: 'Font Settings' })}
        >
          <SettingsIcon className="h-4 w-4" />
        </ToolbarButton>
      )}

      <ToolbarButton
        onClick={() => toggleTool('circle')}
        isActive={activeTool?.id === 'circle'}
        aria-label={t('annotation.circle', { fallback: 'Circle annotation' })}
        title={t('annotation.circle', { fallback: 'Draw Circle' })}
      >
        <CircleIcon className="h-4 w-4" style={{ color: toolColors.circle?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('square')}
        isActive={activeTool?.id === 'square'}
        aria-label={t('annotation.rectangle', { fallback: 'Square annotation' })}
        title={t('annotation.rectangle', { fallback: 'Draw Rectangle' })}
      >
        <SquareIcon className="h-4 w-4" style={{ color: toolColors.square?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('polygon')}
        isActive={activeTool?.id === 'polygon'}
        aria-label={t('annotation.polygon', { fallback: 'Polygon annotation' })}
        title={t('annotation.polygon', { fallback: 'Draw Polygon' })}
      >
        <PolygonIcon className="h-4 w-4" style={{ color: toolColors.polygon?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('polyline')}
        isActive={activeTool?.id === 'polyline'}
        aria-label={t('annotation.polyline', { fallback: 'Polyline annotation' })}
        title={t('annotation.polyline', { fallback: 'Draw Polyline' })}
      >
        <PolylineIcon className="h-4 w-4" style={{ color: toolColors.polyline?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('line')}
        isActive={activeTool?.id === 'line'}
        aria-label={t('annotation.line', { fallback: 'Line annotation' })}
        title={t('annotation.line', { fallback: 'Draw Line' })}
      >
        <LineIcon className="h-4 w-4" style={{ color: toolColors.line?.primaryColor }} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => toggleTool('lineArrow')}
        isActive={activeTool?.id === 'lineArrow'}
        aria-label={t('annotation.arrow', { fallback: 'Arrow annotation' })}
        title={t('annotation.arrow', { fallback: 'Draw Arrow' })}
      >
        <ArrowIcon className="h-4 w-4" style={{ color: toolColors.lineArrow?.primaryColor }} />
      </ToolbarButton>

      {/* Divider */}
      <div className="mx-1 h-6 w-px bg-gray-300" />

      {/* Undo/Redo buttons */}
      <ToolbarButton onClick={handleUndo} disabled={!canUndo} aria-label="Undo" title="Undo">
        <UndoIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={handleRedo} disabled={!canRedo} aria-label="Redo" title="Redo">
        <RedoIcon className="h-4 w-4" />
      </ToolbarButton>

      {/* Divider */}
      <div className="mx-1 h-6 w-px bg-gray-300" />

      {/* Export Button */}
      <ExportButton documentId={documentId} className="text-xs px-2 py-1" />

      {/* Font Settings Panel */}
      <FreeTextFontPanel
        documentId={documentId}
        isVisible={showFontPanel}
        onClose={() => setShowFontPanel(false)}
      />

      {/* Shape Settings Panel */}
      <ShapeSettingsPanel
        isVisible={showShapePanel && activeTool !== null && SHAPE_TOOLS.includes(activeTool.id)}
        toolId={activeTool?.id || ''}
        onClose={() => setShowShapePanel(false)}
      />

      {/* Markup Settings Panel (highlight, underline, strikethrough, squiggly) */}
      <MarkupSettingsPanel
        isVisible={showMarkupPanel && activeTool !== null && MARKUP_TOOLS.includes(activeTool.id)}
        toolId={activeTool?.id || ''}
        onClose={() => setShowMarkupPanel(false)}
      />

      {/* Ink Settings Panel (pen, highlighter) */}
      <InkSettingsPanel
        isVisible={showInkPanel && activeTool !== null && INK_TOOLS.includes(activeTool.id)}
        toolId={activeTool?.id || ''}
        onClose={() => setShowInkPanel(false)}
      />
    </div>
  );
}
