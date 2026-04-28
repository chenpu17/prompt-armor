#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const candidates = [
  join(__dirname, '..', 'dist', 'server', 'index.js'),       // bundled (npm publish)
  join(__dirname, '..', 'packages', 'server', 'dist', 'index.js'), // tsc built
];
const entry = candidates.find(p => existsSync(p));
if (!entry) {
  console.error('[prompt-armor] 找不到服务端入口，请先运行 `npm run build`');
  process.exit(1);
}

const port = Number(process.env.PORT || 7842);
const host = process.env.HOST || '127.0.0.1';
const noBrowser = process.argv.includes('--no-open') || process.env.NO_OPEN === '1';

const mod = await import(entry);
await mod.startServer(port, host);

const url = `http://${host}:${port}`;
console.log(`\n  🛡  Prompt Armor 已启动: ${url}\n`);

if (!noBrowser) {
  try {
    const open = (await import('open')).default;
    await open(url);
  } catch { /* ignore */ }
}
