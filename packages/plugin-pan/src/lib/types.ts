import { BasePluginConfig } from '@embedpdf/core';

export interface PanPluginConfig extends BasePluginConfig {}

export interface PanCapability {
  enablePan: () => void;
  disablePan: () => void;
}
