import { PdfPageGeometry } from '@embedpdf/models';

/**
 * Hit-test helper using runs
 * @param geo - page geometry
 * @param pt - point
 * @returns glyph index
 */
export function glyphAt(geo: PdfPageGeometry, pt:{x:number;y:number}){
  for(const run of geo.runs) {
    const inRun = (
      pt.y >= run.rect.y && pt.y <= run.rect.y + run.rect.height &&
      pt.x >= run.rect.x && pt.x <= run.rect.x + run.rect.width
    );

    if (!inRun) continue;

    // Simply check if the point is within any glyph's bounding box
    const rel = run.glyphs.findIndex(g => 
      pt.x >= g.x && pt.x <= g.x + g.width &&
      pt.y >= g.y && pt.y <= g.y + g.height
    );

    if (rel !== -1) {
      return run.charStart + rel;
    }
  }
  return -1;
}