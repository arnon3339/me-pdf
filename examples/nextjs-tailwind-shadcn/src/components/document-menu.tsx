import { useState } from 'react';
import { useExport } from '@embedpdf/plugin-export/react';
import { useCapture } from '@embedpdf/plugin-capture/react';
import { useFullscreen } from '@embedpdf/plugin-fullscreen/react';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import type { PdfAnnotationObject } from '@embedpdf/models';
import { exportPdfWithCustomAnnotations, isCustomRenderAnnotation } from '../utils/pdf-export';
import { fontDataStore } from '../utils/font-data-store';
import {
  MenuIcon,
  PrintIcon,
  DownloadIcon,
  ScreenshotIcon,
  FullscreenIcon,
  FullscreenExitIcon,
} from './icons';
import { PrintDialog } from './print-dialog';
import { CaptureDialog } from './capture-dialog';
import { ToolbarButton, DropdownMenu, DropdownItem } from './ui';

type DocumentMenuProps = {
  documentId: string;
};

export function DocumentMenu({ documentId }: DocumentMenuProps) {
  const { provides: exportProvider } = useExport(documentId);
  const { provides: captureProvider, state: captureState } = useCapture(documentId);
  const { provides: fullscreenProvider, state: fullscreenState } = useFullscreen();
  const { provides: annotationCapability } = useAnnotationCapability();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!exportProvider) return null;

  const handleDownload = async () => {
    if (!annotationCapability || isExporting) return;

    setIsExporting(true);
    // setIsMenuOpen(false); // Keep menu open or close? Close seems better but maybe show loading state?
    // Let's close it and let the user wait (or we can show a toast later)
    setIsMenuOpen(false);

    try {
      // Get all annotations from state
      const state = annotationCapability.getState();
      const allAnnotations: PdfAnnotationObject[] = [];
      const customRenderAnnotations: PdfAnnotationObject[] = [];

      // Collect annotations from byUid (the actual annotation data)
      if (state.byUid) {
        for (const tracked of Object.values(state.byUid) as any[]) {
          if (tracked && tracked.object) {
            const anno = tracked.object as PdfAnnotationObject;
            allAnnotations.push(anno);

            // Check if this annotation requires custom rendering
            if (isCustomRenderAnnotation(anno)) {
              customRenderAnnotations.push(anno);
            }
          }
        }
      }

      const hasCustomRendering = customRenderAnnotations.length > 0;

      // For custom render annotations, delete them from PDFium before export
      if (hasCustomRendering) {
        for (const anno of customRenderAnnotations) {
          annotationCapability.forDocument(documentId).deleteAnnotation(anno.pageIndex, anno.id);
        }
        // Wait a bit for the deletion to process
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Export the base PDF using PDFium (now without custom render annotations)
      const exportTask = exportProvider.saveAsCopy(); // exportProvider is already scoped to documentId
      const basePdfBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        exportTask.wait(resolve, reject);
      });

      let finalPdfBytes: Uint8Array;

      if (hasCustomRendering) {
        // Get font data from the store
        const fontDataMap = fontDataStore.getAll();

        // Use pdf-lib to add custom annotations
        finalPdfBytes = await exportPdfWithCustomAnnotations(
          new Uint8Array(basePdfBytes),
          customRenderAnnotations,
          fontDataMap
        );

        // Re-import the deleted annotations back to the state
        const annoScope = annotationCapability.forDocument(documentId);
        for (const anno of customRenderAnnotations) {
          annoScope.importAnnotations([{ annotation: anno }]);
        }
      } else {
        // No custom rendering, use the base export directly
        finalPdfBytes = new Uint8Array(basePdfBytes);
      }

      // Create download link
      const blob = new Blob([finalPdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `document-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setIsMenuOpen(false);
    setIsPrintDialogOpen(true);
  };

  const handleScreenshot = () => {
    if (captureProvider) {
      captureProvider.toggleMarqueeCapture();
    }
    setIsMenuOpen(false);
  };

  const handleFullscreen = () => {
    fullscreenProvider?.toggleFullscreen(`#${documentId}`);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="relative">
        <ToolbarButton
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          isActive={isMenuOpen}
          aria-label="Document Menu"
          title="Document Menu"
        >
          <MenuIcon className="h-4 w-4" />
        </ToolbarButton>

        <DropdownMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} className="w-48">
          <DropdownItem
            isActive={captureState.isMarqueeCaptureActive}
            onClick={handleScreenshot}
            icon={<ScreenshotIcon className="h-4 w-4" title="Capture Area" />}
          >
            Capture Area
          </DropdownItem>
          <DropdownItem
            onClick={handlePrint}
            icon={<PrintIcon className="h-4 w-4" title="Print" />}
          >
            Print
          </DropdownItem>
          <DropdownItem
            onClick={handleDownload}
            icon={<DownloadIcon className="h-4 w-4" title="Download" />}
            disabled={isExporting} // Disable if exporting
          >
            {isExporting ? 'Downloading...' : 'Download'}
          </DropdownItem>
          <DropdownItem
            onClick={handleFullscreen}
            icon={
              fullscreenState.isFullscreen ? (
                <FullscreenExitIcon className="h-4 w-4" title="Exit Fullscreen" />
              ) : (
                <FullscreenIcon className="h-4 w-4" title="Fullscreen" />
              )
            }
          >
            {fullscreenState.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </DropdownItem>
        </DropdownMenu>
      </div>

      {/* Print Dialog */}
      <PrintDialog
        documentId={documentId}
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
      />

      {/* Capture Dialog */}
      <CaptureDialog documentId={documentId} />
    </>
  );
}
