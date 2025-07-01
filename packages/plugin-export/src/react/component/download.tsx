import { ignore } from '@embedpdf/models';
import { useEffect, useRef } from 'react';

import { useExportCapability } from '../hooks';

export function Download() {
  const { provides: exportCapability } = useExportCapability();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!exportCapability) return;

    const unsub = exportCapability.onRequest(async (action) => {
      if (action === 'download') {
        const el = ref.current;
        if (!el) return;

        const task = exportCapability.saveAsCopy();
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
  }, [exportCapability]);

  return <a style={{ display: 'none' }} ref={ref} />;
}
