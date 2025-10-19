import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';
import { VERSION as SVELTE_VERSION, preprocess as sveltePreprocess } from 'svelte/compiler';
import { emitDts as emitDtsFromS2T } from 'svelte2tsx';

const isSvelte5Plus = Number(SVELTE_VERSION.split('.')[0]) >= 5;

function mkdirp(dir: string) { fs.mkdirSync(dir, { recursive: true }); }
function rimraf(p: string) { fs.rmSync(p, { force: true, recursive: true }); }
function posixify(s: string) { return s.replace(/\\/g, '/'); }
async function walk(rootAbs: string): Promise<string[]> {
  const out: string[] = [];
  async function rec(dirAbs: string) {
    const items = await fsp.readdir(dirAbs, { withFileTypes: true });
    for (const ent of items) {
      const abs = path.join(dirAbs, ent.name);
      if (ent.isDirectory()) await rec(abs);
      else out.push(abs);
    }
  }
  await rec(rootAbs);
  return out;
}
function stripLangTags(content: string) {
  return content
    .replace(
      /(<!--[^]*?-->)|(<script[^>]*?)\s(?:type|lang)=(["'])(.*?)\3/g,
      (m, c, t, _q, type) => type?.startsWith('application/') || (isSvelte5Plus && type === 'ts') ? m : (c ?? '') + (t ?? '')
    )
    .replace(/(<!--[^]*?-->)|(<style[^>]*?)\s(?:type|lang)=(["']).*?\3/g, '$1$2');
}
function resolveAliases(inputAbs: string, fileRelFromInput: string, content: string, aliases: Record<string,string>) {
  const replaceImportPath = (match: string, quote: string, importPath: string) => {
    for (const [alias, value] of Object.entries(aliases)) {
      const exact = importPath === alias;
      const starts = importPath.startsWith(alias + (alias.endsWith('/') ? '' : '/'));
      if (!exact && !starts) continue;
      const fromAbs = path.join(inputAbs, fileRelFromInput);
      const destAbs = path.join(value, importPath.slice(alias.length));
      let rel = posixify(path.relative(path.dirname(fromAbs), destAbs));
      if (!rel.startsWith('.')) rel = './' + rel;
      return match.replace(quote + importPath + quote, quote + rel + quote);
    }
    return match;
  };
  content = content.replace(
    /\b(?:import|export)(?:\s+type)?(?:(?:\s+\p{L}[\p{L}0-9]*\s+)|(?:(?:\s+\p{L}[\p{L}0-9]*\s*,\s*)?\s*\{[^}]*\}\s*))from\s*(['"])([^'";]+)\1/gmu,
    (m, q, p) => replaceImportPath(m, q, p)
  );
  content = content.replace(
    /\b(?:import|export)(?:\s+type)?\s*\*\s*as\s+\p{L}[\p{L}0-9]*\s+from\s*(['"])([^'";]+)\1/gmu,
    (m, q, p) => replaceImportPath(m, q, p)
  );
  content = content.replace(
    /\b(?:export)(?:\s+type)?\s*\*\s*from\s*(['"])([^'";]+)\1/gmu,
    (m, q, p) => replaceImportPath(m, q, p)
  );
  content = content.replace(/\bimport\s*\(\s*(['"])([^'";]+)\1\s*\)/g, (m, q, p) =>
    replaceImportPath(m, q, p)
  );
  content = content.replace(/\bimport\s+(['"])([^'";]+)\1/g, (m, q, p) =>
    replaceImportPath(m, q, p)
  );
  return content;
}

export type SveltePackagePluginOptions = {
  input: string;
  output: string;
  alias?: Record<string, string>;
  tsconfig?: string;
  preprocess?: import('svelte/types/compiler/preprocess').PreprocessorGroup | undefined;
  preserveOutput?: boolean;
};

export function viteSveltePackagePlugin(opts: SveltePackagePluginOptions): Plugin {
  const cwd = process.cwd();
  const inputAbs = path.resolve(cwd, opts.input);
  const outputAbs = path.resolve(cwd, opts.output);
  // Keep temp dir INSIDE inputAbs to avoid relative paths going upward
  const tmpTypesAbs = path.resolve(inputAbs, '__package_types_tmp__');
  const alias = opts.alias ?? {};
  const require = createRequire(import.meta.url);

  let viteOutDirAbs = path.resolve(cwd, 'dist');
  let didEmit = false;

  const sanitizeRel = (rel: string) => {
    let p = rel.replace(/^[A-Za-z]:[/\\]/, ''); // drop drive letters
    p = p.replace(/^[/\\]+/, '');               // drop leading slashes
    const parts = p.split(/[\\/]+/).filter((seg) => seg && seg !== '..');
    return parts.join('/');
  };

  return {
    name: 'vite-svelte-package',
    apply: 'build',

    configResolved(config) {
      viteOutDirAbs = path.resolve(config.root, config.build.outDir ?? 'dist');
    },

    async buildStart() {
      if (!fs.existsSync(inputAbs)) this.error(`${path.relative(cwd, inputAbs)} does not exist`);
      if (!opts.preserveOutput) {
        rimraf(outputAbs);
      } else {
        // Even with preserveOutput, clean up any .d.ts files to avoid duplicates
        if (fs.existsSync(outputAbs)) {
          const existingFiles = await walk(outputAbs);
          for (const f of existingFiles.filter(f => f.endsWith('.d.ts') || f.endsWith('.d.ts.map'))) {
            try {
              await fsp.unlink(f);
            } catch {
              // ignore errors
            }
          }
        }
      }
      mkdirp(outputAbs);
    },

    async generateBundle() {
      if (didEmit) return;
      didEmit = true;

      // 1) build .d.ts into temp dir
      rimraf(tmpTypesAbs);
      mkdirp(tmpTypesAbs);

      let svelteShimsPath: string;
      try {
        const major = Number((SVELTE_VERSION || '5').split('.')[0]);
        svelteShimsPath =
          major >= 4
            ? require.resolve('svelte2tsx/svelte-shims-v4.d.ts')
            : require.resolve('svelte2tsx/svelte-shims.d.ts');
      } catch {
        svelteShimsPath = require.resolve('svelte2tsx/svelte-shims-v4.d.ts');
      }

      // Pass relative path to avoid nested absolute paths
      await emitDtsFromS2T({
        libRoot: inputAbs,
        svelteShimsPath,
        declarationDir: path.relative(inputAbs, tmpTypesAbs),
        tsconfig: opts.tsconfig
      });

      const outSubdir = posixify(path.relative(viteOutDirAbs, outputAbs)) || '';
      const emitAsset = (absDestInsideOutput: string, source: string | Uint8Array) => {
        const relInside = posixify(path.relative(outputAbs, absDestInsideOutput));
        const relSafe = sanitizeRel(relInside);
        const fileName = outSubdir ? `${outSubdir}/${relSafe}` : relSafe;
        this.emitFile({ type: 'asset', fileName, source });
      };

      // 2) copy sources
      const allFilesAbs = await walk(inputAbs);
      for (const abs of allFilesAbs) {
        const relFromInput = posixify(path.relative(inputAbs, abs));
        if (relFromInput === 'index.ts' || relFromInput === 'index.js') continue;
        
        // Skip .d.ts files - they'll be handled in step 3
        if (abs.endsWith('.d.ts') || abs.endsWith('.d.ts.map')) continue;

        const isSvelte = /\.[sS]velte$/.test(abs);
        const isTS = abs.endsWith('.ts') && !abs.endsWith('.d.ts');
        let contents = await fsp.readFile(abs, 'utf8');

        if (isSvelte && opts.preprocess) {
          const pre = await sveltePreprocess(contents, opts.preprocess, { filename: abs });
          contents = stripLangTags(pre.code);
        }

        if (isTS) {
          const ts = (await import('typescript')).default;
          contents = ts.transpileModule(contents, {
            compilerOptions: {
              module: ts.ModuleKind.ESNext,
              target: ts.ScriptTarget.ES2020,
              moduleResolution: ts.ModuleResolutionKind.NodeNext,
              sourceMap: false
            },
            fileName: abs
          }).outputText;
        }

        const resolved = resolveAliases(inputAbs, relFromInput, contents, alias);
        const destAbs = path.join(outputAbs, isTS ? relFromInput.replace(/\.ts$/, '.js') : relFromInput);
        emitAsset(destAbs, resolved);
      }

      // 3) move .d.ts from temp dir → output
      if (fs.existsSync(tmpTypesAbs)) {
        const typeFilesAbs = await walk(tmpTypesAbs);
        
        for (const abs of typeFilesAbs) {
          const rel = posixify(path.relative(tmpTypesAbs, abs));
          const destAbs = path.join(outputAbs, rel);
          
          let text = await fsp.readFile(abs, 'utf8');

          if (abs.endsWith('.d.ts.map')) {
            try {
              const parsed = JSON.parse(text);
              if (parsed?.sources) {
                parsed.sources = (parsed.sources as string[]).map((src: string) => {
                  const finalDir = path.dirname(destAbs);
                  const fromDir = path.dirname(path.join(inputAbs, rel));
                  return posixify(path.join(path.relative(finalDir, fromDir), path.basename(src)));
                });
                text = JSON.stringify(parsed);
              }
            } catch {
              // ignore malformed maps
            }
          } else {
            text = resolveAliases(inputAbs, rel, text, alias);
          }

          emitAsset(destAbs, text);
        }
      }

      // 4) cleanup temp directory and any stray .d.ts files
      rimraf(tmpTypesAbs);
      
      // Clean up any stray .d.ts files that TypeScript created in the source directory
      // This can happen when tsconfig has paths that resolve to absolute locations
      if (fs.existsSync(inputAbs)) {
        const srcFiles = await walk(inputAbs);
        const dtsFiles = srcFiles.filter(f => f.endsWith('.d.ts') || f.endsWith('.d.ts.map'));
        for (const f of dtsFiles) {
          try {
            await fsp.unlink(f);
            // Try to remove empty parent directories
            let dir = path.dirname(f);
            while (dir !== inputAbs && dir.startsWith(inputAbs)) {
              try {
                const contents = await fsp.readdir(dir);
                if (contents.length === 0) {
                  await fsp.rmdir(dir);
                  dir = path.dirname(dir);
                } else {
                  break;
                }
              } catch {
                break;
              }
            }
          } catch {
            // ignore errors
          }
        }
      }

      this.warn(`${posixify(path.relative(cwd, inputAbs))} -> ${posixify(path.relative(cwd, outputAbs))}`);
    }
  };
}