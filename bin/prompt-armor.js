#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const argv = process.argv.slice(2);

function getArg(name, short) {
  const flags = [`--${name}`, short && `-${short}`].filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    if (flags.includes(argv[i])) return argv[i + 1];
    for (const f of flags) {
      if (argv[i].startsWith(`${f}=`)) return argv[i].slice(f.length + 1);
    }
  }
  return undefined;
}

function hasFlag(name) {
  return argv.includes(`--${name}`);
}

if (hasFlag('help') || argv[0] === 'help') {
  console.log(`\n🛡  ${pkg.name} v${pkg.version}\n   ${pkg.description}\n`);
  console.log('Usage:');
  console.log('  prompt-armor                启动服务并打开浏览器');
  console.log('  prompt-armor start          同上（显式 start 子命令）');
  console.log('  prompt-armor --port 8080    指定端口');
  console.log('  prompt-armor --host 0.0.0.0 监听任意网卡');
  console.log('  prompt-armor --no-open      启动但不自动打开浏览器');
  console.log('  prompt-armor --version      打印版本');
  console.log('  prompt-armor --help         打印帮助\n');
  console.log('Env:');
  console.log('  PORT, HOST, NO_OPEN=1, PROMPT_ARMOR_DATA_DIR\n');
  process.exit(0);
}

if (hasFlag('version') || hasFlag('v') || argv[0] === 'version') {
  console.log(pkg.version);
  process.exit(0);
}

const sub = argv[0];
if (sub && !sub.startsWith('-') && sub !== 'start') {
  console.error(`[prompt-armor] 未知子命令: ${sub}`);
  console.error(`运行 \`prompt-armor --help\` 查看用法`);
  process.exit(1);
}

const candidates = [
  join(__dirname, '..', 'dist', 'server', 'index.js'),
  join(__dirname, '..', 'packages', 'server', 'dist', 'index.js'),
];
const entry = candidates.find((p) => existsSync(p));
if (!entry) {
  console.error('[prompt-armor] 找不到服务端入口，请先运行 `npm run build`');
  process.exit(1);
}

const port = Number(getArg('port', 'p') || process.env.PORT || 7842);
const host = getArg('host') || process.env.HOST || '127.0.0.1';
const noBrowser = hasFlag('no-open') || process.env.NO_OPEN === '1';

const mod = await import(entry);
await mod.startServer(port, host);

const url = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
console.log(`\n  🛡  Prompt Armor 已启动: ${url}\n`);

if (!noBrowser) {
  try {
    const open = (await import('open')).default;
    await open(url);
  } catch {
    /* ignore */
  }
}
