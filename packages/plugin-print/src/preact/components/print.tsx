/** @jsxImportSource preact */
import { createContext, render } from 'preact';
import { useContext, useRef, useEffect, useState } from 'preact/hooks';
import { ComponentChildren } from 'preact';
import { usePrintCapability } from '../hooks/use-print';
import { PrintOptions, PrintProgress, PrintPageResult, ParsedPageRange } from '../../lib/types';

interface PrintContextValue {
  parsePageRange: (rangeString: string) => ParsedPageRange;
  executePrint: (options: PrintOptions) => Promise<void>;
  progress: PrintProgress | null;
  isReady: boolean;
  isPrinting: boolean;
}

const PrintContext = createContext<PrintContextValue | null>(null);

interface PrintProviderProps {
  children: ComponentChildren;
}

interface PrintPageProps {
  pageResult: PrintPageResult;
}

const PrintPage = ({ pageResult }: PrintPageProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(pageResult.blob);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pageResult.blob]);

  const handleLoad = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  };

  return (
    <div
      style={{
        pageBreakAfter: 'always',
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: 'white',
        position: 'relative',
      }}
    >
      <img
        src={imageUrl}
        onLoad={handleLoad}
        alt={`Page ${pageResult.pageIndex + 1}`}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

interface PrintLayoutProps {
  pages: PrintPageResult[];
}

const PrintLayout = ({ pages }: PrintLayoutProps) => {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        backgroundColor: '#fff',
      }}
    >
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
        }
      `}</style>
      {pages.map((pageResult) => (
        <div key={pageResult.pageIndex}>
          <PrintPage pageResult={pageResult} />
        </div>
      ))}
    </div>
  );
};

export function PrintProvider({ children }: PrintProviderProps) {
  const { provides: printCapability } = usePrintCapability();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [progress, setProgress] = useState<PrintProgress | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [pages, setPages] = useState<PrintPageResult[]>([]);

  const executePrint = async (options: PrintOptions): Promise<void> => {
    if (!printCapability) {
      throw new Error('Print capability not available');
    }

    if (!iframeRef.current?.contentWindow) {
      throw new Error('Print iframe not ready');
    }

    setIsPrinting(true);
    setProgress(null);
    setPages([]);
    setIsReady(false);

    try {
      const collectedPages: PrintPageResult[] = [];

      // Prepare print with progress tracking
      await printCapability.preparePrint(
        options,
        // Progress callback
        (progressUpdate: PrintProgress) => {
          setProgress(progressUpdate);
        },
        // Page ready callback
        (pageResult: PrintPageResult) => {
          collectedPages.push(pageResult);
          setPages([...collectedPages]); // Update pages as they come in
        },
      );

      // Wait a bit for all content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Execute print
      const printWindow = iframeRef.current.contentWindow!;
      printWindow.focus();
      printWindow.print();

      setProgress({
        current: progress?.total || 0,
        total: progress?.total || 0,
        status: 'complete',
        message: 'Print dialog opened',
      });
    } catch (error) {
      setProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: `Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    } finally {
      setIsPrinting(false);
    }
  };

  // Render the print layout into the iframe when pages change
  useEffect(() => {
    const iframe = iframeRef.current;
    const mountNode = iframe?.contentWindow?.document?.body;

    if (mountNode && pages.length > 0) {
      render(<PrintLayout pages={pages} />, mountNode);
      setIsReady(true);

      return () => {
        if (mountNode) {
          render(null, mountNode);
        }
      };
    }
  }, [pages]);

  const contextValue: PrintContextValue = {
    parsePageRange: printCapability?.parsePageRange || (() => ({ pages: [], isValid: false })),
    executePrint,
    progress,
    isReady,
    isPrinting,
  };

  return (
    <PrintContext.Provider value={contextValue}>
      {children}
      <iframe
        ref={iframeRef}
        style={{
          display: 'none',
          width: '210mm',
          height: '297mm',
        }}
        title="Print Preview"
      />
    </PrintContext.Provider>
  );
}

export function usePrintContext(): PrintContextValue {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error('usePrintContext must be used within a PrintProvider');
  }
  return context;
}
