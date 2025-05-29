/**
 * Create an external worker from a URL.
 * @param url - The URL of the worker to create.
 * @returns A new worker instance.
 */
export async function createExternalWorker(url: string) {
  const src = await (await fetch(url, { mode: 'cors' })).text();
  const blobUrl = URL.createObjectURL(
    new Blob([`importScripts("${url}");`], { type: 'application/javascript' }),
  );
  const w = new Worker(blobUrl); // classic worker; no origin error
  URL.revokeObjectURL(blobUrl); // free memory once loaded
  return w;
}
