import { useEffect, useRef } from '@framework';

import { usePrintCapability, usePrintPlugin } from '../hooks';
import { PdfErrorCode } from '@embedpdf/models';

export function PrintFrame() {
  const { provides: printCapability } = usePrintCapability();
  const { plugin: printPlugin } = usePrintPlugin();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!printCapability || !printPlugin) return;

    const unsubscribe = printPlugin.onPrintRequest((request) => {
      const { options, task } = request;
      const iframe = iframeRef.current;

      if (!iframe) {
        task.reject({
          code: PdfErrorCode.Cancelled,
          message: 'Print iframe not available',
        });
        return;
      }

      // Clean up previous URL if exists
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }

      // Reset iframe
      iframe.src = 'about:blank';

      const prepareTask = printPlugin.preparePrintDocument(options);
      prepareTask.wait((buffer) => {
        // Document is ready
        task.progress({
          stage: 'document-ready',
          message: 'Document prepared successfully',
        });

        const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));

        urlRef.current = url;

        // Set up onload handler
        iframe.onload = () => {
          if (iframe.src === url) {
            // Iframe is ready
            task.progress({
              stage: 'iframe-ready',
              message: 'Ready to print',
            });

            // Trigger print
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            task.progress({
              stage: 'printing',
              message: 'Print dialog opened',
            });

            // Resolve the task
            task.resolve(buffer);
          }
        };

        iframe.src = url;
      }, task.fail);
    });

    return () => {
      unsubscribe();
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, [printCapability, printPlugin]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        position: 'absolute',
        display: 'none',
      }}
      title="Print Document"
      src="about:blank"
    />
  );
}
