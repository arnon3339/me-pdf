export const parseUid = (uid: string) => {
  const [pg, rest] = uid.slice(1).split('#');
  return { pageIndex: Number(pg), annotationId: Number(rest) };
};

export const makeUid = (page: number, id: number) => `p${page}#${id}`;
