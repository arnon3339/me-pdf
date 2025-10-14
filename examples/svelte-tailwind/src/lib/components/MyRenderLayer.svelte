<script lang="ts">
    import { RenderLayer } from '@embedpdf/plugin-render/svelte';
    import { useLoaderCapability } from '@embedpdf/plugin-loader/svelte';
    import { useRegistry } from '@embedpdf/core/svelte';

    const loaderCapability = $derived(useLoaderCapability());

    const reg = useRegistry();
    let document = $state(reg?.registry?.getStore().getState().core.document);

    async function handleDocChange(
        e: Event & {
            currentTarget: EventTarget & HTMLInputElement;
        }
    ) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        const cap = loaderCapability?.provides;
        if (file && cap) {
            const arrayBuffer = await file.arrayBuffer();
            await cap.loadDocument({
                type: 'buffer',
                pdfFile: {
                    id: Math.random().toString(36).substring(2, 15),
                    name: file.name,
                    content: arrayBuffer
                }
            });
            document = reg?.registry?.getStore().getState().core.document;
        }
    }
</script>

<input type="file" accept="application/pdf" onchange={handleDocChange} />

<RenderLayer pageIndex={0} doc={document} />
