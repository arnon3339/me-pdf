import {
  MouseEvent,
  TouchEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  suppressContentEditableWarningProps,
} from '@framework';
import {
  PdfFreeTextAnnoObject,
  PdfVerticalAlignment,
  fontRefToCss,
  textAlignmentToCss,
  isStandardFontRef,
  standardFontIsBold,
  standardFontIsItalic,
  PdfFontRef,
} from '@embedpdf/models';

function getFontStyles(font: PdfFontRef) {
  if (isStandardFontRef(font)) {
    return {
      fontWeight: standardFontIsBold(font.font) ? 'bold' : 'normal',
      fontStyle: standardFontIsItalic(font.font) ? 'italic' : 'normal',
    };
  }
  // Custom font
  const styleStr = (font.style + ' ' + font.fullName).toLowerCase();

  let fontWeight = 'normal';
  if (styleStr.includes('thin') || styleStr.includes('hairline')) fontWeight = '100';
  else if (styleStr.includes('extra light') || styleStr.includes('extralight') || styleStr.includes('ultra light')) fontWeight = '200';
  else if (styleStr.includes('light')) fontWeight = '300';
  else if (styleStr.includes('semi bold') || styleStr.includes('semibold') || styleStr.includes('demi')) fontWeight = '600';
  else if (styleStr.includes('extra bold') || styleStr.includes('extrabold') || styleStr.includes('ultra bold')) fontWeight = '800';
  else if (styleStr.includes('bold')) fontWeight = 'bold';
  else if (styleStr.includes('black') || styleStr.includes('heavy')) fontWeight = '900';
  else if (styleStr.includes('medium')) fontWeight = '500';

  return {
    fontWeight,
    fontStyle: styleStr.includes('italic') || styleStr.includes('oblique') ? 'italic' : 'normal',
  };
}
import { useAnnotationCapability } from '../..';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';

interface FreeTextProps {
  isSelected: boolean;
  isEditing: boolean;
  annotation: TrackedAnnotation<PdfFreeTextAnnoObject>;
  pageIndex: number;
  scale: number;
  onClick?: (e: MouseEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => void;
  onDoubleClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export function FreeText({
  isSelected,
  isEditing,
  annotation,
  pageIndex,
  scale,
  onClick,
}: FreeTextProps) {
  const editorRef = useRef<HTMLSpanElement>(null);
  const { provides: annotationProvides } = useAnnotationCapability();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      const editor = editorRef.current;
      editor.focus();

      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

  useLayoutEffect(() => {
    try {
      const nav = navigator as any;
      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && nav?.maxTouchPoints > 1);
      setIsIOS(ios);
    } catch {
      setIsIOS(false);
    }
  }, []);

  const handleBlur = () => {
    if (!annotationProvides) return;
    if (!editorRef.current) return;
    annotationProvides.updateAnnotation(pageIndex, annotation.object.id, {
      contents: editorRef.current.innerText,
    });
  };

  // iOS zoom prevention: keep focused font-size >= 16px, visually scale down if needed.
  const computedFontPx = annotation.object.fontSize * scale;
  const MIN_IOS_FOCUS_FONT_PX = 16;
  const needsComp =
    isIOS && isEditing && computedFontPx > 0 && computedFontPx < MIN_IOS_FOCUS_FONT_PX;
  const adjustedFontPx = needsComp ? MIN_IOS_FOCUS_FONT_PX : computedFontPx;
  const scaleComp = needsComp ? computedFontPx / MIN_IOS_FOCUS_FONT_PX : 1;
  const invScalePercent = needsComp ? 100 / scaleComp : 100;

  return (
    <div
      style={{
        position: 'absolute',
        width: annotation.object.rect.size.width * scale,
        height: annotation.object.rect.size.height * scale,
        cursor: isSelected && !isEditing ? 'move' : 'default',
        pointerEvents: isSelected && !isEditing ? 'none' : 'auto',
        zIndex: 2,
      }}
      onPointerDown={onClick}
      onTouchStart={onClick}
    >
      <span
        ref={editorRef}
        onBlur={handleBlur}
        tabIndex={0}
        style={{
          color: annotation.object.fontColor,
          fontSize: adjustedFontPx,
          fontFamily: fontRefToCss(annotation.object.fontFamily),
          ...getFontStyles(annotation.object.fontFamily),
          textAlign: textAlignmentToCss(annotation.object.textAlign),
          flexDirection: 'column',
          justifyContent:
            annotation.object.verticalAlign === PdfVerticalAlignment.Top
              ? 'flex-start'
              : annotation.object.verticalAlign === PdfVerticalAlignment.Middle
                ? 'center'
                : 'flex-end',
          display: 'flex',
          backgroundColor: annotation.object.backgroundColor,
          opacity: annotation.object.opacity,
          width: needsComp ? `${invScalePercent}%` : '100%',
          height: needsComp ? `${invScalePercent}%` : '100%',
          lineHeight: '1.18',
          overflow: 'hidden',
          cursor: isEditing ? 'text' : 'pointer',
          outline: 'none',
          transform: needsComp ? `scale(${scaleComp})` : undefined,
          transformOrigin: 'top left',
        }}
        contentEditable={isEditing}
        {...suppressContentEditableWarningProps}
      >
        {annotation.object.contents}
      </span>
    </div>
  );
}
