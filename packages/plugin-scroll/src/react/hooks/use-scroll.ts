import { useCapability } from '@embedpdf/core/react';
import { ScrollPlugin } from '@embedpdf/plugin-scroll';

export const useScroll = () => useCapability<ScrollPlugin>('scroll');
