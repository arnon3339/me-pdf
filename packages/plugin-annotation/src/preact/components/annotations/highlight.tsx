/** @jsxImportSource preact */
import { ComponentChildren, Fragment, JSX } from 'preact';
import { PdfHighlightAnnoObject, PdfAlphaColor } from '@embedpdf/models';

export function HighlightAnnotation({
  annotation,
  scale,
}: {
  annotation: PdfHighlightAnnoObject;
  scale: number;
}) {
  // Default highlight color if none is specified
  const highlightColor = annotation.color || { red: 255, green: 255, blue: 0, alpha: 76 };

  // Convert color to CSS rgba format
  const rgbaColor = `rgba(${highlightColor.red}, ${highlightColor.green}, ${highlightColor.blue}, ${highlightColor.alpha / 255})`;

  return (
    <div
      className="highlight-annotation"
      style={{ position: 'absolute', mixBlendMode: 'multiply' }}
    >
      {annotation.segmentRects.map((rect, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${rect.origin.x * scale}px`,
            top: `${rect.origin.y * scale}px`,
            width: `${rect.size.width * scale}px`,
            height: `${rect.size.height * scale}px`,
            backgroundColor: rgbaColor,
          }}
        />
      ))}
    </div>
  );
}
