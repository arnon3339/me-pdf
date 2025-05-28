import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { AttachmentPlugin } from '@embedpdf/plugin-attachment';

export const useAttachment = () => usePlugin<AttachmentPlugin>(AttachmentPlugin.id);
export const useAttachmentCapability = () => useCapability<AttachmentPlugin>(AttachmentPlugin.id);
