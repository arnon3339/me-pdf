import { WebWorkerEngine } from '@embedpdf/engines/worker';

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore injected at build time
declare const __WEBWORKER_BODY__: string;

/** Builds a Worker without any network request. */
export function createWorkerEngine(): WebWorkerEngine {
  const worker = new Worker(
    URL.createObjectURL(new Blob([__WEBWORKER_BODY__], { type: 'application/javascript' })),
    {
      type: 'module',
    },
  );

  return new WebWorkerEngine(worker);
}
