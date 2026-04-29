// Bundle published package layout:
//   dist/server/index.js  — esbuild single-file bundle (all deps inlined, better-sqlite3 external)
//   dist/server/db/schema.sql
//   dist/public/          — Vite frontend build
import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const dist = join(root, 'dist');
if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'server', 'db'), { recursive: true });

// Bundle server with all npm deps inlined; keep native module external
await build({
  entryPoints: [join(root, 'packages/server/src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(dist, 'server/index.js'),
  external: ['better-sqlite3'],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  define: { 'process.env.NODE_ENV': '"production"' },
});

cpSync(join(root, 'packages/server/src/db/schema.sql'), join(dist, 'server/db/schema.sql'));
cpSync(join(root, 'packages/server/public'), join(dist, 'public'), { recursive: true });

console.log('[bundle] dist/ ready');
