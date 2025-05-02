import { h, VNode } from 'preact';
import { IconIdentifier, IconRenderOptions } from '@embedpdf/plugin-ui';
import { useIcon } from '@embedpdf/plugin-ui/preact';

export interface IconProps extends IconRenderOptions {
  icon: IconIdentifier;
}

/**
 * Icon component for React
 * Renders an icon from the registry or a raw SVG string in an SSR-compatible way
 */
export function Icon({ icon, className, title }: IconProps): VNode | null {
  const iconManager = useIcon();
  let svgContent: string | undefined;
  
  // Check if it's a data URI
  if (iconManager.isSvgDataUri(icon)) {
    svgContent = iconManager.dataUriToSvgString(icon);
  } else {
    svgContent = iconManager.getSvgString(icon);
  }
  
  if (!svgContent) {
    console.warn(`Icon not found: ${icon}`);
    return null;
  }

  // Build the component with dangerouslySetInnerHTML to avoid DOM usage
  const iconElement = (
    <span 
      className={className} 
      dangerouslySetInnerHTML={{ 
        __html: svgContent
      }}
    />
  );

  return title ? (
    <span title={title}>
      {iconElement}
    </span>
  ) : iconElement;
}