import { MouseEvent } from '@framework';
import { PdfStandardFont, Rect, standardFontCss } from '@embedpdf/models';

interface FreeTextProps {
  isSelected: boolean;
  rect: Rect;
  backgroundColor: string;
  fontColor: string;
  fontSize: number;
  fontFamily: PdfStandardFont;
  scale: number;
  contents: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

export function FreeText({
  isSelected,
  rect,
  backgroundColor,
  fontColor,
  fontSize,
  fontFamily,
  scale,
  contents,
  onClick,
  onDoubleClick,
}: FreeTextProps) {
  return (
    <div
      style={{
        position: 'absolute',
        width: rect.size.width * scale,
        height: rect.size.height * scale,
        cursor: isSelected ? 'move' : 'pointer',
        pointerEvents: isSelected ? 'none' : 'auto',
        zIndex: 2,
      }}
      onPointerDown={onClick}
    >
      <span
        style={{
          color: fontColor,
          fontSize: fontSize * scale,
          fontFamily: standardFontCss(fontFamily),
          backgroundColor: backgroundColor,
          width: '100%',
          height: '100%',
          display: 'block',
          overflow: 'hidden',
        }}
      >
        {contents}
      </span>
    </div>
  );
}
