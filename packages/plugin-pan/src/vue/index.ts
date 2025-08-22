import { WithAutoMount } from '@embedpdf/core';
import { PanPluginPackage as BasePanPackage } from '@embedpdf/plugin-pan';
import { PanMode } from './components';

export * from './hooks';
export * from './components';

export const PanPluginPackage: WithAutoMount<typeof BasePanPackage> = {
  ...BasePanPackage,
  autoMountElements: () => [PanMode],
};

export * from '@embedpdf/plugin-pan';
