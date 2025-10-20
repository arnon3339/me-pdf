import ts from "typescript";

interface ResolverTransformOutput {
  path: string;
  content: string;
}

type MaybePromise<T> = T | Promise<T>;

interface Resolver {
  /**
   * The name of the resolver
   *
   * The later resolver with the same name will overwrite the earlier
   */
  name: string;
  /**
   * Determine whether the resolver supports the file
   */
  supports: (id: string) => void | boolean;
  /**
   * Transform source to declaration files
   *
   * Note that the path of the returns should base on `outDir`, or relative path to `root`
   */ 
  transform: (payload: {
      id: string;
      code: string;
      root: string;
      outDir: string;
      host: ts.CompilerHost;
      program: ts.Program;
  }) => MaybePromise<ResolverTransformOutput[] | {
      outputs: ResolverTransformOutput[];
      emitSkipped?: boolean;
      diagnostics?: readonly ts.Diagnostic[];
  }>;
}
// Lazy to avoid loading when not building svelte
let _svelte2tsx: undefined | ((code: string, opts: any) => { code: string });
async function getSvelte2Tsx() {
  if (_svelte2tsx) return _svelte2tsx;
  const { svelte2tsx } = await import('svelte2tsx');
  _svelte2tsx = svelte2tsx;
  return _svelte2tsx;
}

const svelteRE = /\.svelte$/;

export function SvelteDtsResolver(): Resolver {

  return {
    name: 'svelte', // IMPORTANT: this overrides unplugin-dts’ built-in Svelte resolver
    supports(id) {
      return svelteRE.test(id);
    },
    async transform({ id, code, root }) {
      try {
        const svelte2tsx = await getSvelte2Tsx();
        const isTsFile = /<script\s+[^>]*lang\s*=\s*['"](ts|typescript)['"][^>]*>/.test(code);
        const out = svelte2tsx(code, {
          filename: id,
          isTsFile,
          mode: 'dts',
          noSvelteCompontentTyped: true,
        });
        return [{ path: `${id}.d.ts`.replace(root + '/', ''), content: out.code }];
      } catch {
        return [{ path: `${id}.d.ts`.replace(root + '/', ''), content: `export { SvelteComponent as default } from 'svelte';\n` }];
      }
    },
  };
}
