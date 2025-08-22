import { WithAutoMount } from '@embedpdf/core';
import { SelectionPluginPackage as BaseSelectionPluginPackage } from '@embedpdf/plugin-selection';

import { CopyToClipboard } from './components';

export * from './hooks';
export * from './components';

export const SelectionPluginPackage: WithAutoMount<typeof BaseSelectionPluginPackage> = {
  ...BaseSelectionPluginPackage,
  autoMountElements: () => [CopyToClipboard],
};

export * from '@embedpdf/plugin-selection';
