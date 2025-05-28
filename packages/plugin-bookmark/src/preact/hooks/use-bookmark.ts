import { useCapability, usePlugin } from '@embedpdf/core/preact';
import { BookmarkPlugin } from '@embedpdf/plugin-bookmark';

export const useBookmark = () => usePlugin<BookmarkPlugin>(BookmarkPlugin.id);
export const useBookmarkCapability = () => useCapability<BookmarkPlugin>(BookmarkPlugin.id);
