import { useUI } from './use-ui';
import { IconIdentifier, Icon as IconType, IconRegistry } from '@embedpdf/plugin-ui';

/**
 * Hook to access icon functionality in React
 */
export function useIcon() {
  const ui = useUI();
  
  if (!ui) {
    throw new Error('useIcon must be used within a UI context');
  }
  
  const {
    registerIcon,
    registerIcons,
    getIcon,
    getAllIcons,
    getSvgString,
    isSvgString,
    isSvgDataUri,
    dataUriToSvgString,
    svgStringToDataUri,
  } = ui;

  return {
    registerIcon,
    registerIcons,
    getIcon,
    getAllIcons,
    getSvgString,
    isSvgString,
    isSvgDataUri,
    dataUriToSvgString,
    svgStringToDataUri,
  };
}