import { useCapability, usePlugin } from "@embedpdf/core/preact";
import { AnnotationPlugin } from "@embedpdf/plugin-annotation";

export const useAnnotation = () => usePlugin<AnnotationPlugin>(AnnotationPlugin.id);
export const useAnnotationCapability = () => useCapability<AnnotationPlugin>(AnnotationPlugin.id);