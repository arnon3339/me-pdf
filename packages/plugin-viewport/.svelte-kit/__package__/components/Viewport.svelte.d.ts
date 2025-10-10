import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
type ViewportProps = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
    class?: string;
};
declare const Viewport: import("svelte").Component<ViewportProps, {}, "">;
type Viewport = ReturnType<typeof Viewport>;
export default Viewport;
