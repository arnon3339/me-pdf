import { Fragment, useMemo, ComponentType } from '@framework';
import type { PluginBatchRegistration } from '@embedpdf/core';
import type { IPlugin } from '@embedpdf/core';

/** Matches WithAutoMount shape used by plugins */
type MaybeWithAutoMount = {
  autoMountElements?: () => ComponentType[]; // React/Preact components
};

interface AutoMountProps {
  plugins: PluginBatchRegistration<IPlugin<any>, any>[];
}

/**
 * Renders any auto-mount utility components declared by plugin packages
 * in a hidden off-layout container. Lives inside PDFContext.
 */
export function AutoMount({ plugins }: AutoMountProps) {
  const comps = useMemo(() => {
    const out: ComponentType[] = [];
    for (const reg of plugins) {
      const maybe = reg.package as unknown as MaybeWithAutoMount;
      if (typeof maybe.autoMountElements === 'function') {
        const arr = maybe.autoMountElements() || [];
        out.push(...arr);
      }
    }
    return out;
  }, [plugins]);

  if (!comps.length) return null;

  return (
    <Fragment>
      {comps.map((C, i) => (
        <Fragment key={i}>
          <C />
        </Fragment>
      ))}
    </Fragment>
  );
}
