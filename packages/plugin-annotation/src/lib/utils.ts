/**
 * Creates a stable, document-wide unique ID from a page index and a stable local ID.
 */
export const makeUid = (pageIndex: number, localId: number): string => `p${pageIndex}#${localId}`;

/**
 * Parses a UID string back into its constituent page index and stable local ID.
 */
export const parseUid = (uid: string): { pageIndex: number; localId: number } => {
  const [pg, rest] = uid.slice(1).split('#');
  return { pageIndex: Number(pg), localId: Number(rest) };
};
