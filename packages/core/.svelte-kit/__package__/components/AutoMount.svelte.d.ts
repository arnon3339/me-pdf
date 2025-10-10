import { type PluginBatchRegistration, type IPlugin } from '@embedpdf/core';
import type { Snippet } from 'svelte';
type Props = {
    plugins: PluginBatchRegistration<IPlugin<any>, any>[];
    children: Snippet;
};
declare const AutoMount: import("svelte").Component<Props, {}, "">;
type AutoMount = ReturnType<typeof AutoMount>;
export default AutoMount;
