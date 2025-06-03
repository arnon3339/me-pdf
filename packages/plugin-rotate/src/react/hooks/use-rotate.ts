import { useCapability, usePlugin } from '@embedpdf/core/react';
import { RotatePlugin } from '@embedpdf/plugin-rotate';

export const useRotate = () => usePlugin<RotatePlugin>(RotatePlugin.id);
export const useRotateCapability = () => useCapability<RotatePlugin>(RotatePlugin.id);
