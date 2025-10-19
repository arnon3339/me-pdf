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
    if (!fs.existsSync(dirAbs)) return;
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
function resolveAliases(fileAbs: string, content: string, aliases: Record<string,string>) {
  const replaceImportPath = (match: string, quote: string, importPath: string) => {
    for (const [alias, value] of Object.entries(aliases)) {
      const exact = importPath === alias;
      const starts = importPath.startsWith(alias + (alias.endsWith('/') ? '' : '/'));
      if (!exact && !starts) continue;
      
      const destAbs = path.join(value, importPath.slice(alias.length));
      let rel = posixify(path.relative(path.dirname(fileAbs), destAbs));
      if (!rel.startsWith('.')) rel = './' + rel;
      return match.replace(quote + importPath + quote, quote + rel + quote);
    }
    return match;
  };

  const regexes = [
    /\b(?:import|export)(?:\s+type)?(?:(?:\s+\p{L}[\p{L}0-9]*\s+)|(?:(?:\s+\p{L}[\p{L}0-9]*\s*,\s*)?\s*\{[^}]*\}\s*))from\s*(['"])([^'";]+)\1/gmu,
    /\b(?:import|export)(?:\s+type)?\s*\*\s*as\s+\p{L}[\p{L}0-9]*\s+from\s*(['"])([^'";]+)\1/gmu,
    /\b(?:export)(?:\s+type)?\s*\*\s*from\s*(['"])([^'";]+)\1/gmu,
    /\bimport\s*\(\s*(['"])([^'";]+)\1\s*\)/g,
    /\bimport\s+(['"])([^'";]+)\1/g,
  ];

  for (const regex of regexes) {
    content = content.replace(regex, (m, q, p) => replaceImportPath(m, q, p));
  }

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
  const srcRootAbs = path.resolve(inputAbs, '..'); // Assuming 'src' dir
  const sharedRootAbs = path.resolve(srcRootAbs, 'shared');
  
  const tmpTypesAbs = path.resolve(outputAbs, '..', '__package_types_tmp__');
  // This is the predictable but incorrect location where svelte2tsx places files
  const strayTypesDirAbs = path.resolve(srcRootAbs, 'dist', '__package_types_tmp__');
  const strayParentDirAbs = path.resolve(srcRootAbs, 'dist'); // The parent to clean up
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

  const rewriteSharedImports = (content: string) => {
    // Replaces imports like '../../shared/utils' with '../../shared-svelte/utils'
    return content.replace(/(['"])([^"']*)(\/shared\/)/g, '$1$2/shared-svelte/');
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
        rimraf(path.resolve(outputAbs, '../shared-svelte'));
      } else {
        // Even with preserveOutput, clean up any .d.ts files to avoid duplicates
        if (fs.existsSync(outputAbs)) {
          const existingFiles = await walk(outputAbs);
          for (const f of existingFiles.filter(f => f.endsWith('.d.ts') || f.endsWith('.d.ts.map'))) {
            try { await fsp.unlink(f); } catch { /* ignore */ }
          }
        }
      }
      mkdirp(outputAbs);
    },

    async generateBundle(options, bundle) {
      // --- 0. Post-process Vite's output to fix paths ---
      // This must run for EVERY format (ES, CJS, etc.), so it's before the didEmit check
      console.log('[vite-svelte-package] Bundle files:', Object.keys(bundle));
      
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        
        // Only process JavaScript chunks
        if (chunk.type === 'chunk' && (fileName.endsWith('.js') || fileName.endsWith('.cjs'))) {
          console.log('[vite-svelte-package] Processing:', fileName);
          
          // Check if there are any ../ imports to fix
          const hasRelativePaths = chunk.code.includes('../');
          
          if (hasRelativePaths) {
            // Fix ESM imports/exports: from '../...' to from './...'
            chunk.code = chunk.code.replace(
              /((?:import|export)(?:\s+(?:type\s+)?(?:\{[^}]*\}|[\w$]+(?:\s*,\s*\{[^}]*\})?))?\s*(?:from\s+)?['"])\.\.\/(components|hooks)\//g,
              '$1./$2/'
            );
            
            // Fix CommonJS require - handle both spaced and minified versions
            chunk.code = chunk.code.replace(
              /(\brequire\s*\(\s*)(['"])\.\.\/(components|hooks)\//g,
              '$1$2./$3/'
            );
            
            console.log('[vite-svelte-package] Fixed paths in', fileName);
          }
        }
      }
      
      // Asset emission should only happen once
      if (didEmit) return;
      didEmit = true;
      const sharedDeps = new Set<string>();
      const initialFiles = await walk(inputAbs);
      const filesToScan = [...initialFiles];
      const scannedFiles = new Set<string>();

      while (filesToScan.length > 0) {
        const fileAbs = filesToScan.shift()!;
        if (scannedFiles.has(fileAbs)) continue;
        scannedFiles.add(fileAbs);

        if (!/\.(svelte|ts|js)$/.test(fileAbs)) continue;

        const contents = await fsp.readFile(fileAbs, 'utf8');
        const importRegex = /(?:from|import)\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(contents)) !== null) {
          const importPath = match[1];
          if (!importPath.startsWith('.')) continue; // Not a relative import

          const resolvedPath = path.resolve(path.dirname(fileAbs), importPath);
          const potentialFiles = [
            resolvedPath,
            `${resolvedPath}.ts`,
            `${resolvedPath}/index.ts`,
          ];
          
          for (const p of potentialFiles) {
            if (fs.existsSync(p) && p.startsWith(sharedRootAbs)) {
              sharedDeps.add(p);
              if (!scannedFiles.has(p)) {
                filesToScan.push(p);
              }
              break;
            }
          }
        }
      }

      // --- 2. Build .d.ts into a predictable "stray" directory ---
      rimraf(tmpTypesAbs);
      rimraf(strayParentDirAbs);
      mkdirp(tmpTypesAbs);

      let svelteShimsPath: string;
      try {
        svelteShimsPath = require.resolve('svelte2tsx/svelte-shims-v4.d.ts');
      } catch {
        this.error('Could not resolve svelte2tsx shims');
        return;
      }
      
      const dtsOptions = {
        libRoot: srcRootAbs,
        svelteShimsPath,
        // This relative path tricks svelte2tsx into putting files in `src/dist/...`
        declarationDir: path.relative(srcRootAbs, tmpTypesAbs),
        tsconfig: opts.tsconfig
      };
      
      try {
        await emitDtsFromS2T(dtsOptions);
      } catch (e: any) {
        this.error(`[ERROR] DTS generation failed:\n${e.stack || e.message || e}`);
        return; // Stop the build if DTS generation fails
      }
      
      const outSubdir = posixify(path.relative(viteOutDirAbs, path.resolve(outputAbs, '..'))) || '';
      const emitAsset = (fileName: string, source: string | Uint8Array) => {
        const finalFileName = outSubdir ? `${outSubdir}/${fileName}` : fileName;
        this.emitFile({ type: 'asset', fileName: finalFileName, source });
      };

      // --- 3. Process and emit Svelte package sources ---
      for (const abs of initialFiles) {
        const relFromInput = posixify(path.relative(inputAbs, abs));
        if (relFromInput.startsWith('index.')) continue;
        if (abs.endsWith('.d.ts') || abs.endsWith('.d.ts.map')) continue;

        const isSvelte = abs.endsWith('.svelte');
        const isTS = abs.endsWith('.ts');
        let contents = await fsp.readFile(abs, 'utf8');

        if (isSvelte && opts.preprocess) {
          const pre = await sveltePreprocess(contents, opts.preprocess, { filename: abs });
          contents = stripLangTags(pre.code);
        }

        if (isTS) {
          const ts = (await import('typescript')).default;
          contents = ts.transpileModule(contents, {
            compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, sourceMap: false },
            fileName: abs
          }).outputText;
        }

        const withAliases = resolveAliases(abs, contents, alias);
        const withRewrittenImports = rewriteSharedImports(withAliases);
        
        const destRel = isTS ? relFromInput.replace(/\.ts$/, '.js') : relFromInput;
        emitAsset(`svelte/${destRel}`, withRewrittenImports);
      }
      
      // --- 4. Process and emit Shared sources ---
      for (const sharedAbs of sharedDeps) {
        if (!sharedAbs.endsWith('.ts')) continue;
        const ts = (await import('typescript')).default;
        
        let contents = await fsp.readFile(sharedAbs, 'utf8');
        const withAliases = resolveAliases(sharedAbs, contents, alias);
        const withRewrittenImports = rewriteSharedImports(withAliases);

        const outputText = ts.transpileModule(withRewrittenImports, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, sourceMap: false },
          fileName: sharedAbs
        }).outputText;
        
        const relFromShared = path.relative(sharedRootAbs, sharedAbs);
        emitAsset(`shared-svelte/${relFromShared.replace(/\.ts$/, '.js')}`, outputText);
      }

      // --- 5. Move .d.ts from the STRAY dir to final output ---
      if (fs.existsSync(strayTypesDirAbs)) {
        const typeFilesAbs = await walk(strayTypesDirAbs);
        
        for (const abs of typeFilesAbs) {
          // Calculate path relative to the STRAY directory
          const relFromTmp = posixify(path.relative(strayTypesDirAbs, abs));
          
          // --- FILTERING LOGIC ---
          if (relFromTmp.startsWith('shared/')) {
            const originalSourceAbs = path.resolve(srcRootAbs, relFromTmp.replace(/\.d\.ts$/, '.ts'));
            if (!sharedDeps.has(originalSourceAbs)) {
              continue; // Skip unused shared .d.ts files
            }
          }
          
          let text = await fsp.readFile(abs, 'utf8');
          
          if (abs.endsWith('.d.ts.map')) {
            try {
              const parsed = JSON.parse(text);
              if (parsed?.sources && Array.isArray(parsed.sources)) {
                let finalMapFileDestRel: string | undefined;
                if (relFromTmp.startsWith('svelte/')) {
                  finalMapFileDestRel = relFromTmp;
                } else if (relFromTmp.startsWith('shared/')) {
                  finalMapFileDestRel = relFromTmp.replace(/^shared\//, 'shared-svelte/');
                }

                if (finalMapFileDestRel) {
                  // Absolute path of the map file in its final destination
                  const finalMapFileAbs = path.resolve(viteOutDirAbs, finalMapFileDestRel);
                  const finalMapDirAbs = path.dirname(finalMapFileAbs);

                  parsed.sources = parsed.sources.map((src: string) => {
                    // Absolute path of the original source file, resolved from the temp map's location
                    const sourceFileAbs = path.resolve(path.dirname(abs), src);
                    // The new relative path from the final map destination to the original source file
                    const newRelativeSource = path.relative(finalMapDirAbs, sourceFileAbs);
                    return posixify(newRelativeSource);
                  });
                  text = JSON.stringify(parsed);
                }
              }
            } catch {
              // ignore malformed maps
            }
          } else {
            const originalFileAbs = path.resolve(srcRootAbs, relFromTmp);
            const withAliases = resolveAliases(originalFileAbs, text, alias);
            text = rewriteSharedImports(withAliases);
          }

          if (relFromTmp.startsWith('svelte/')) {
            emitAsset(relFromTmp, text);
          } else if (relFromTmp.startsWith('shared/')) {
            const destRel = relFromTmp.replace(/^shared\//, 'shared-svelte/');
            emitAsset(destRel, text);
          }
        }
      }

      // --- 7. Cleanup ---
      rimraf(tmpTypesAbs);
      rimraf(strayParentDirAbs); // Clean up the entire stray `src/dist` directory

      this.warn(`${posixify(path.relative(cwd, inputAbs))} -> ${posixify(path.relative(cwd, outputAbs))}`);
    }
  };
}