import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { ScrollPlugin } from '@embedpdf/plugin-scroll';

export const useScroll = () => usePlugin<ScrollPlugin>(ScrollPlugin.id);
export const useScrollCapability = () => useCapability<ScrollPlugin>(ScrollPlugin.id);
