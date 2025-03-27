import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import { defineConfig, Expression, ChokidarWatcher } from 'turbowatch';

const foundPackageJson = globSync('packages/*/package.json');

type PathToPackageNameMap = Map<string, string>;

const allPackages = foundPackageJson.reduce<PathToPackageNameMap>(
  (acc, current) => {
    try {
      const packageJson = readFileSync(current, 'utf8');
      const packageJsonParsed = JSON.parse(packageJson) as {
        dependencies: Record<string, string>;
        name: string | undefined;
      };

      const packageName = packageJsonParsed.name;

      if (!packageName) {
        return acc;
      }

      acc.set(current, packageName);
      return acc;
    } catch (_) {}

    return acc;
  },
  new Map()
);

const dirList = [...allPackages.keys()].map(
  (dir) => ['dirname', dir.replace('/package.json', '')] satisfies Expression
);

console.log(JSON.stringify([
  'allof',
  ['anyof', ...dirList],
  ['not', ['anyof', ['dirname', 'node_modules'], ['dirname', 'dist'], ['dirname', '.next']]],
  [
    'anyof',
    ['match', '*.ts', 'basename'],
    ['match', '*.tsx', 'basename'],
    ['match', '*.js', 'basename'],
  ],
], null, 2)
);

export default defineConfig({
  project: process.cwd(),
  Watcher: ChokidarWatcher,
  triggers: [
    {
      expression: [
        'allof',
        ['anyof', ...dirList],
        ['not', ['anyof', ['dirname', 'node_modules'], ['dirname', 'dist'], ['dirname', '.next']]],
        [
          'anyof',
          ['match', '*.ts', 'basename'],
          ['match', '*.tsx', 'basename'],
          ['match', '*.js', 'basename'],
        ],
      ],
      interruptible: true,
      name: 'build',
      onChange: async ({ spawn, files, abortSignal }) => {
        const changedPackages = new Set<string>();
        for (const file of files) {
          const pkgJsonPath = file.name
            .replace(`${process.cwd()}/`, '')
            .replace(/\/src\/.*/, '/package.json');

          const packageName = allPackages.get(pkgJsonPath);

          if (!packageName) {
            continue;
          }

          changedPackages.add(packageName);
        }

        if (changedPackages.size === 0) {
          return;
        }

        await spawn`turbo run build --filter=${[...changedPackages].join(',')}`;
        if (abortSignal?.aborted) return;
      },
    },
  ],
});