import { PdfAlphaColor } from './pdf';

/**
 * Convert a {@link PdfAlphaColor} to a CSS-style colour definition.
 *
 * @param c - the colour coming from PDFium (0-255 per channel)
 * @returns
 *   hex   – #RRGGBB (no alpha channel)
 *   opacity – 0-1 float suitable for CSS `opacity`/`rgba()`
 */
export function pdfAlphaColorToHexOpacity(c: PdfAlphaColor): {
  hex: `#${string}`;
  opacity: number;
} {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');

  const hex = `#${toHex(c.red)}${toHex(c.green)}${toHex(c.blue)}` as const;
  const opacity = clamp(c.alpha) / 255;

  return { hex, opacity };
}

/**
 * Convert a CSS hex colour + opacity back into {@link PdfAlphaColor}
 *
 * @param hex      - #RGB, #RRGGBB, or #rrggbb
 * @param opacity  - 0-1 float (values outside clamp automatically)
 */
export function hexOpacityToPdfAlphaColor(hex: string, opacity: number): PdfAlphaColor {
  // Normalise: #abc → #aabbcc
  if (/^#?[0-9a-f]{3}$/i.test(hex)) {
    hex = hex.replace(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3').toLowerCase();
  }

  const [, r, g, b] =
    /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex) ??
    (() => {
      throw new Error(`Invalid hex colour: “${hex}”`);
    })();

  const clamp = (n: number, hi = 255) => Math.max(0, Math.min(hi, n));

  return {
    red: parseInt(r, 16),
    green: parseInt(g, 16),
    blue: parseInt(b, 16),
    alpha: clamp(Math.round(opacity * 255)),
  };
}
