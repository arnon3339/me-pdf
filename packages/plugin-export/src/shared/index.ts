import { WithAutoMount } from '@embedpdf/core';
import { ExportPluginPackage as BaseExportPackage } from '@embedpdf/plugin-export';

import { Download } from './component';

export * from './hooks';
export * from './component';

export const ExportPluginPackage: WithAutoMount<typeof BaseExportPackage> = {
  ...BaseExportPackage,
  autoMountElements: () => [Download],
};

export * from '@embedpdf/plugin-export';
