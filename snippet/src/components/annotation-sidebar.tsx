/** @jsxImportSource preact */
import { h } from 'preact';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/preact';
import { PdfAnnotationSubtype } from '@embedpdf/models';
import { SelectedAnnotation } from '@embedpdf/plugin-annotation';

import { SidebarPropsBase } from './annotation-sidebar/common';
import { SIDEbars } from './annotation-sidebar/registry';
import { EmptyState } from './annotation-sidebar/empty-state';

// ─────────────────────────────────────────────────────────────────────────
//  Public API (signature unchanged so callers don’t change)
// ─────────────────────────────────────────────────────────────────────────
export function leftPanelAnnotationStyleRenderer({
  selectedAnnotation,
  activeVariant,
  colorPresets,
}: {
  selectedAnnotation: SelectedAnnotation | null;
  activeVariant: string | null;
  colorPresets: string[];
}) {
  const { provides: annotation } = useAnnotationCapability();
  if (!annotation) return null;

  /* ------------------------------------------------------------
   * 1. Work out which subtype we’re editing (selected note > tool)
   * ------------------------------------------------------------ */
  let subtype: PdfAnnotationSubtype | null = null;

  if (selectedAnnotation) {
    subtype = selectedAnnotation.annotation.type;
  } else if (activeVariant) {
    subtype = annotation.getToolDefaults(activeVariant)?.subtype ?? null;
  }

  /* ------------------------------------------------------------
   * 2. Dispatch to concrete sidebar or show empty state
   * ------------------------------------------------------------ */
  if (subtype == null) return <EmptyState />;

  const Sidebar = SIDEbars[subtype];
  if (!Sidebar) return <EmptyState />;

  const commonProps: SidebarPropsBase = {
    selected: selectedAnnotation,
    subtype,
    activeVariant,
    colorPresets,
  };

  return <Sidebar {...(commonProps as any)} />;
}
