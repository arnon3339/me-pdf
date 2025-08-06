/**
 * Creates a stable, document-wide unique ID from a page index and a stable annotation ID.
 */
export const makeUid = (pageIndex: number, id: string): string => `p${pageIndex}#${id}`;

/**
 * Parses a UID string back into its constituent page index and stable annotation ID.
 */
export const parseUid = (uid: string): { pageIndex: number; id: string } => {
  const separatorIndex = uid.indexOf('#');
  const pg = uid.substring(1, separatorIndex);
  const id = uid.substring(separatorIndex + 1);
  return { pageIndex: Number(pg), id };
};
