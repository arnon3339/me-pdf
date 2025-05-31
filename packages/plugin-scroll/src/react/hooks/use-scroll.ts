import { useCapability, usePlugin } from '@embedpdf/core/react';
import { ScrollPlugin } from '@embedpdf/plugin-scroll';

export const useScroll = () => usePlugin<ScrollPlugin>(ScrollPlugin.id);
export const useScrollCapability = () => useCapability<ScrollPlugin>(ScrollPlugin.id);
