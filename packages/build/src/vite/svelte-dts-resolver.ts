import ts from 'typescript';
import path from 'node:path';

/**
 * Minimal local copy of the resolver type used by unplugin-dts.
 * If you can import it from 'unplugin-dts', feel free to replace this with:
 *   import type { Resolver } from 'unplugin-dts';
 */
export interface Resolver {
  name: string;
  supports: (id: string) => boolean | void;
  transform: (payload: {
    id: string;
    code: string;
    root: string;
    outDir: string;
    host: ts.CompilerHost;
    program: ts.Program;
  }) => Promise<
    | { path: string; content: string }[]
    | {
        outputs: { path: string; content: string }[];
        emitSkipped?: boolean;
        diagnostics?: readonly ts.Diagnostic[];
      }
  >;
}

/* ───────────────────────── helpers ───────────────────────── */

let _s2t: undefined | ((code: string, opts: any) => { code: string });
async function s2t() {
  if (_s2t) return _s2t;
  const { svelte2tsx } = await import('svelte2tsx');
  _s2t = svelte2tsx;
  return _s2t;
}

function relativeToRoot(root: string, abs: string) {
  const norm = abs.replace(/\\/g, '/');
  const r = root.replace(/\\/g, '/').replace(/\/$/, '');
  return norm.startsWith(r + '/') ? norm.slice(r.length + 1) : norm;
}

function extractScript(source: string) {
  const m = source.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  const script = m?.[1] ?? '';
  // keep only normal import lines; drop svelte/internal early
  const importLines = script
    .split('\n')
    .filter((l) => /^\s*import\s+/.test(l) && !/from\s+['"]svelte\/internal['"]/.test(l));
  return { script, importLines };
}

/** Find `$props` binding and its interface (e.g., `RotateProps`) from the original <script> */
function findPropsInterfaceFromScript(script: string) {
  const sf = ts.createSourceFile('comp.ts', script, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

  let propsTypeName: string | undefined;
  let propsInterfaceText: string | undefined;

  sf.forEachChild((node) => {
    if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        const hasObjBinding = d.name && ts.isObjectBindingPattern(d.name);
        const hasType =
          !!d.type && ts.isTypeReferenceNode(d.type) && ts.isIdentifier(d.type.typeName);
        const isPropsInit =
          d.initializer && ts.isIdentifier(d.initializer) && d.initializer.text === '$props';

        if (hasObjBinding && hasType && isPropsInit) {
          propsTypeName = (d.type!.typeName as ts.Identifier).text; // e.g. "RotateProps"
        }
      }
    }
  });

  if (propsTypeName) {
    sf.forEachChild((node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === propsTypeName) {
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        propsInterfaceText = printer.printNode(ts.EmitHint.Unspecified, node, sf);
      }
    });
  }

  return { propsTypeName, propsInterfaceText };
}

/** If we didn’t find props in <script>, try a generic pattern in text (tsx or dts-like) */
function findPropsInterfaceFromText(text: string) {
  const m = text.match(/interface\s+([A-Za-z0-9_]+Props)\s*\{[^]*?\}/m);
  return { propsTypeName: m?.[1], propsInterfaceText: m?.[0] };
}

/** Walk the props interface to collect referenced type identifiers (e.g., Size, Snippet) */
function collectTypeRefsFromInterface(propsInterfaceText?: string): Set<string> {
  const refs = new Set<string>();
  if (!propsInterfaceText) return refs;

  const sf = ts.createSourceFile('props.ts', propsInterfaceText, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

  function visit(n: ts.Node) {
    if (ts.isTypeReferenceNode(n)) {
      const addIdent = (id: ts.EntityName) => {
        if (ts.isIdentifier(id)) refs.add(id.text);
        else {
          addIdent(id.left);
          refs.add(id.right.text);
        }
      };
      addIdent(n.typeName);
    }
    n.forEachChild(visit);
  }
  sf.forEachChild(visit);
  return refs;
}

/**
 * Keep only import lines relevant for the props interface and convert them to `import type`.
 * - relevant if the imported name is referenced in props (or svelte’s Snippet/SvelteComponent)
 * - avoid `import type type` with a negative lookahead
 * - drop value-only imports like hooks
 */
function normalizeImportsToType(importLines: string[], propsInterfaceText?: string) {
  const needed = collectTypeRefsFromInterface(propsInterfaceText);
  const alwaysFromSvelte = new Set(['Snippet', 'SvelteComponent', 'SvelteComponentTyped']);

  const keep: string[] = [];

  for (const line of importLines) {
    if (!/^\s*import\s+/.test(line)) continue;

    // Parse this individual line to see what it imports
    const sf = ts.createSourceFile('i.ts', line, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

    let sourceModule = '';
    const namesInImport = new Set<string>();
    let hasTypeModifier = /\bimport\s+type\b/.test(line);

    sf.forEachChild((n) => {
      if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
        sourceModule = n.moduleSpecifier.text;
        const ic = n.importClause;
        if (ic) {
          if (ic.name) namesInImport.add(ic.name.text);
          if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) {
            for (const el of ic.namedBindings.elements) {
              namesInImport.add((el.propertyName ?? el.name).text);
            }
          }
        }
      }
    });

    // Drop svelte/internal and side-effect imports
    if (sourceModule === 'svelte/internal') continue;

    // Keep only if used by props (or useful Svelte symbols)
    const hasNeeded =
      [...namesInImport].some((n) => needed.has(n)) ||
      (sourceModule === 'svelte' && [...namesInImport].some((n) => alwaysFromSvelte.has(n)));

    if (!hasNeeded) continue;

    // Ensure 'import type' exactly once, using negative lookahead to avoid "import type type"
    const fixed = hasTypeModifier
      ? line
      : line.replace(/^(\s*)import(?!\s+type\b)(\s+)/, '$1import type$2');

    keep.push(fixed);
  }

  // De-dupe and return
  return Array.from(new Set(keep));
}

/** Build the final .d.ts */
function synthesizeDts(
  componentName: string,
  importsBlock: string,
  propsBlock?: string,
  propsName?: string
) {
  const needSvelteImport =
    !/from\s+['"]svelte['"]/.test(importsBlock) || !/SvelteComponent/.test(importsBlock);

  const header = needSvelteImport ? `import type { SvelteComponent } from 'svelte';\n` : '';

  const props =
    propsBlock && propsBlock.trim()
      ? propsBlock.startsWith('export ') ? propsBlock : `export ${propsBlock}`
      : 'export interface Props {}';

  // If we had a named interface (e.g., RotateProps) use it; else fall back to generic Props
  const propsId = propsName ?? (props.includes('interface Props') ? 'Props' : 'Props');

  return [
    header,
    importsBlock,
    importsBlock ? '\n' : '',
    props,
    '\n\n',
    `export default class ${componentName} extends SvelteComponent<${propsId}> {}`,
    '\n',
  ].join('');
}

/* ───────────────────────── resolver ───────────────────────── */

export function SvelteDtsResolver(): Resolver {
  // Svelte 5 (and 4+) friendly: prefer SvelteComponent base
  const noSvelteComponentTyped = true;

  return {
    name: 'svelte',
    supports: (id) => /\.svelte$/.test(id),

    async transform({ id, code, root }) {
      const baseName = path.basename(id, '.svelte');
      const relOut = (abs: string) => relativeToRoot(root, abs);
      const svelte2tsx = await s2t();

      // We always generate a TSX transform; it's the richest source for the Props interface
      const isTsFile = /<script\s+[^>]*lang\s*=\s*['"](ts|typescript)['"][^>]*>/.test(code);
      const tsx = svelte2tsx(code, {
        filename: id,
        isTsFile,
        mode: 'ts',
        noSvelteComponentTyped,
      }).code;

      // 1) Prefer extracting props from the original <script> block
      const { script, importLines } = extractScript(code);
      let { propsTypeName, propsInterfaceText } = findPropsInterfaceFromScript(script);

      // 2) If missing, try the TSX text (usually contains `interface XProps {}`)
      if (!propsInterfaceText) {
        const alt = findPropsInterfaceFromText(tsx);
        propsTypeName = propsTypeName || alt.propsTypeName;
        propsInterfaceText = propsInterfaceText || alt.propsInterfaceText;
      }

      // 3) Keep only type-relevant imports (and convert them to `import type`)
      const imports = normalizeImportsToType(importLines, propsInterfaceText).join('\n');

      // 4) Build the final declaration
      const content = synthesizeDts(baseName, imports, propsInterfaceText, propsTypeName);

      return [{ path: relOut(`${id}.d.ts`), content }];
    },
  };
}
