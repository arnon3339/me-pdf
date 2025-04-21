import { useCapability } from "@embedpdf/core/preact";
import { ScrollPlugin } from "@embedpdf/plugin-scroll";

export const useScroll = () => useCapability<ScrollPlugin>('scroll');