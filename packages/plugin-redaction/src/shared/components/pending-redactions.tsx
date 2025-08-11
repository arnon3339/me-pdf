import { useEffect, useState, useCallback, MouseEvent, TouchEvent } from '@framework';
import { useRedactionCapability } from '../hooks';
import { RedactionItem } from '@embedpdf/plugin-redaction';
import { Highlight } from './highlight';

interface PendingRedactionsProps {
  pageIndex: number;
  scale: number;
  bboxStroke?: string;
}

export function PendingRedactions({
  pageIndex,
  scale,
  bboxStroke = 'rgba(0,0,0,0.8)',
}: PendingRedactionsProps) {
  const { provides: redaction } = useRedactionCapability();
  const [items, setItems] = useState<RedactionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!redaction) return;
    const off1 = redaction.onPendingChange((map) => setItems(map[pageIndex] ?? []));
    const off2 = redaction.onSelectionChange((sel) => {
      setSelectedId(sel && sel.page === pageIndex ? sel.id : null);
    });
    return () => {
      off1?.();
      off2?.();
    };
  }, [redaction, pageIndex]);

  if (!items.length) return null;

  const select = useCallback(
    (e: MouseEvent | TouchEvent, id: string) => {
      e.stopPropagation();
      if (!redaction) return;
      redaction.selectPending(pageIndex, id);
    },
    [redaction, pageIndex],
  );

  console.log(selectedId);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {items.map((it) => {
        if (it.kind === 'area') {
          const r = it.rect;
          return (
            <div
              key={it.id}
              style={{
                position: 'absolute',
                left: r.origin.x * scale,
                top: r.origin.y * scale,
                width: r.size.width * scale,
                height: r.size.height * scale,
                background: 'transparent',
                outline: selectedId === it.id ? `1px solid ${bboxStroke}` : 'none',
                outlineOffset: '2px',
                border: `1px solid red`,
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              onClick={(e) => select(e, it.id)}
            />
          );
        }
        // kind === 'text' → draw bounding box; inner rects are not drawn here to avoid clutter.
        const b = it.boundingRect;
        return (
          <div
            key={it.id}
            style={{
              position: 'absolute',
              left: b.origin.x * scale,
              top: b.origin.y * scale,
              width: b.size.width * scale,
              height: b.size.height * scale,
              background: 'transparent',
              outline: selectedId === it.id ? `1px solid ${bboxStroke}` : 'none',
              outlineOffset: '2px',
              pointerEvents: 'auto',
              cursor: selectedId === it.id ? 'pointer' : 'default',
            }}
          >
            <Highlight
              rect={b}
              rects={it.rects}
              color="transparent"
              border="1px solid red"
              scale={scale}
              onClick={(e) => select(e, it.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
