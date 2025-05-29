/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore injected at build time
declare const __WEBWORKER_BODY__: string;

/** Builds a Worker without any network request. */
export function createEmbeddedWorker() {
  return new Worker(
    URL.createObjectURL(new Blob([__WEBWORKER_BODY__], { type: 'application/javascript' })),
    {
      type: 'module',
    },
  );
}
