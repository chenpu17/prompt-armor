// Bundle published package layout: dist/server/* + dist/server/db/schema.sql + dist/public/*
import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const dist = join(root, 'dist');
if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

cpSync(join(root, 'packages/server/dist'), join(dist, 'server'), { recursive: true });
cpSync(join(root, 'packages/server/src/db/schema.sql'), join(dist, 'server/db/schema.sql'));
cpSync(join(root, 'packages/server/public'), join(dist, 'public'), { recursive: true });

console.log('[bundle] dist/ ready');
