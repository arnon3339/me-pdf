/** @jsxImportSource preact */
import { ignore } from '@embedpdf/models';
import { useEffect, useRef } from 'preact/hooks';

import { useDownloadCapability } from '../hooks';

export function Download() {
  const { provides: downloadCapability } = useDownloadCapability();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!downloadCapability) return;

    const unsub = downloadCapability.onRequest(async (action) => {
      if (action === 'download') {
        const el = ref.current;
        if (!el) return;

        const task = downloadCapability.saveAsCopy();
        task.wait((buffer) => {
          const url = URL.createObjectURL(new Blob([buffer]));
          el.href = url;
          el.download = 'document.pdf';
          el.click();
          URL.revokeObjectURL(url);
        }, ignore);
      }
    });

    return unsub;
  }, [downloadCapability]);

  return <a style={{ display: 'none' }} ref={ref} />;
}
