import { WithAutoMount } from '@embedpdf/core';
import { LoaderPluginPackage as BaseLoaderPackage } from '@embedpdf/plugin-loader';

import { FilePicker } from './components';

export * from './hooks';
export * from './components';

export const LoaderPluginPackage: WithAutoMount<typeof BaseLoaderPackage> = {
  ...BaseLoaderPackage,
  autoMountElements: () => [FilePicker],
};

export * from '@embedpdf/plugin-loader';
