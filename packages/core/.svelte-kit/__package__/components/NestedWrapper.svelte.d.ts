import { type Component, type Snippet } from 'svelte';
import NestedWrapper from './NestedWrapper.svelte';
interface Props {
    wrappers: Component[];
    children?: Snippet;
}
declare const NestedWrapper: Component<Props, {}, "">;
type NestedWrapper = ReturnType<typeof NestedWrapper>;
export default NestedWrapper;
