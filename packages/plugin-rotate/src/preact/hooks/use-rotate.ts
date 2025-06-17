import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { RotatePlugin } from '@embedpdf/plugin-rotate';

export const useRotatePlugin = () => usePlugin<RotatePlugin>(RotatePlugin.id);
export const useRotateCapability = () => useCapability<RotatePlugin>(RotatePlugin.id);
