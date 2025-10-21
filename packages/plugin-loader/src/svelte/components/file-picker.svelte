<script lang="ts">
  import { useLoaderCapability } from '../hooks';

  const { provides: loaderProvides } = useLoaderCapability();

  let inputRef: HTMLInputElement | null = null;

  // Subscribe/unsubscribe whenever the capability changes
  $effect(() => {
    const cap = loaderProvides;
    if (!cap) return;

    // Listen for "open file" requests
    const unsubscribe = cap.onOpenFileRequest((req) => {
      if (req === 'open' && inputRef) {
        inputRef.click();
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  });

  // Handle actual file selection
  async function onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    const cap = loaderProvides;

    if (file && cap) {
      const arrayBuffer = await file.arrayBuffer();
      await cap.loadDocument({
        type: 'buffer',
        pdfFile: {
          id: Math.random().toString(36).substring(2, 15),
          name: file.name,
          content: arrayBuffer,
        },
      });
    }
  }
</script>

<!-- Hidden file picker -->
<input
  bind:this={inputRef}
  type="file"
  accept="application/pdf"
  style="display: none"
  onchange={onChange}
/>
