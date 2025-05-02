/**
 * Represents an icon in the icon registry
 */
export interface Icon {
  id: string;
  svg: string;
}

/**
 * Record type for icon registry
 */
export type IconRegistry = Record<string, Icon>;

/**
 * An identifier for an icon that can be either a registered icon id or raw SVG
 */
export type IconIdentifier = string;

/**
 * Options for rendering an icon
 */
export interface IconRenderOptions {
  className?: string;
  title?: string;
}


/**
 * Capabilities for the IconManager
 */
export interface IconCapabilities {
  registerIcon: (icon: Icon) => void;
  registerIcons: (icons: Icon[] | IconRegistry) => void;
  getIcon: (id: string) => Icon | undefined;
  getAllIcons: () => IconRegistry;
  getSvgString: (identifier: IconIdentifier) => string | undefined;
  isSvgString: (identifier: IconIdentifier) => boolean;
  isSvgDataUri: (value: string) => boolean;
  dataUriToSvgString: (dataUri: string) => string;
  svgStringToDataUri: (svgString: string) => string;
}