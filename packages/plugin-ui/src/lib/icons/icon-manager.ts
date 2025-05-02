import { Icon, IconCapabilities, IconIdentifier, IconRegistry } from './types';

/**
 * Registry for managing icons throughout the application
 */
export class IconManager {
  private icons: IconRegistry = {};

  constructor(icons: Icon[] | IconRegistry) {
    this.registerIcons(icons);
  }

  /**
   * Register a single icon
   */
  public registerIcon(icon: Icon): void {
    if (this.icons[icon.id]) {
      console.warn(`Icon with ID ${icon.id} already exists and will be overwritten`);
    }
    this.icons[icon.id] = icon;
  }

  /**
   * Register multiple icons at once
   */
  public registerIcons(icons: Icon[] | IconRegistry): void {
    if (Array.isArray(icons)) {
      icons.forEach(icon => this.registerIcon(icon));
    } else {
      Object.entries(icons).forEach(([id, icon]) => this.registerIcon(icon));
    }
  }

  /**
   * Get all registered icons
   */
  public getAllIcons(): IconRegistry {
    return { ...this.icons };
  }

  /**
   * Get an icon by its ID
   */
  public getIcon(id: string): Icon | undefined {
    return this.icons[id];
  }

  /**
   * Check if an identifier is an SVG string
   */
  public isSvgString(identifier: IconIdentifier): boolean {
    return identifier.trim().startsWith('<svg') && identifier.includes('</svg>');
  }

  /**
   * Check if a string is an SVG data URI
   */
  public isSvgDataUri(value: string): boolean {
    return value.startsWith('data:image/svg+xml;base64,');
  }

  /**
   * Get the SVG string for an icon identifier
   * If the identifier is a raw SVG string, it is returned as is
   * If the identifier is an icon ID, the registered SVG is returned
   */
  public getSvgString(identifier: IconIdentifier): string | undefined {
    if (this.isSvgString(identifier)) {
      return identifier;
    }
    if (this.isSvgDataUri(identifier)) {
      return this.dataUriToSvgString(identifier);
    }
    return this.getIcon(identifier)?.svg;
  }

  /**
   * Utility method to parse a data URI
   */
  public dataUriToSvgString(dataUri: string): string {
    const base64 = dataUri.substring('data:image/svg+xml;base64,'.length);
    return atob(base64);
  }

  /**
   * Convert an SVG string to a data URI
   */
  public svgStringToDataUri(svgString: string): string {
    const base64 = btoa(svgString);
    return `data:image/svg+xml;base64,${base64}`;
  }

  capabilities(): IconCapabilities {
    return {
      registerIcon: this.registerIcon.bind(this),
      registerIcons: this.registerIcons.bind(this),
      getIcon: this.getIcon.bind(this),
      getAllIcons: this.getAllIcons.bind(this),
      getSvgString: this.getSvgString.bind(this),
      isSvgString: this.isSvgString.bind(this),
      isSvgDataUri: this.isSvgDataUri.bind(this),
      dataUriToSvgString: this.dataUriToSvgString.bind(this),
      svgStringToDataUri: this.svgStringToDataUri.bind(this),
    };
  }
}