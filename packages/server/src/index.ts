import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import './db/index.js'; // initialize DB
import { runSeed } from './seeds/run-seed.js';
import modelsRoute from './routes/models.js';
import promptsRoute from './routes/prompts.js';
import samplesRoute from './routes/samples.js';
import toolsRoute from './routes/tools.js';
import evaluationsRoute from './routes/evaluations.js';
import settingsRoute from './routes/settings.js';
import autoRunsRoute from './routes/auto-runs.js';
import toolProfilesRoute from './routes/tool-profiles.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read version from nearest package.json at startup
function readVersion(): string {
  const pkgCandidates = [
    join(__dirname, '../package.json'),
    join(__dirname, '../../package.json'),
    join(__dirname, '../../../package.json'),
  ];
  for (const p of pkgCandidates) {
    try { return JSON.parse(readFileSync(p, 'utf-8')).version ?? 'unknown'; } catch { /* next */ }
  }
  return 'unknown';
}
const VERSION = readVersion();

export async function startServer(port = 7842, host = '127.0.0.1') {
  runSeed();

  const app = Fastify({ logger: { level: 'info' } });
  await app.register(import('@fastify/sensible'));

  await app.register(modelsRoute);
  await app.register(promptsRoute);
  await app.register(samplesRoute);
  await app.register(toolsRoute);
  await app.register(evaluationsRoute);
  await app.register(settingsRoute);
  await app.register(autoRunsRoute);
  await app.register(toolProfilesRoute);

  app.get('/api/health', async () => ({ ok: true, version: VERSION }));

  // serve static web (built)
  const candidates = [
    join(__dirname, '../public'),       // dev (server/public)
    join(__dirname, '../../public'),    // dist case
    join(__dirname, '../../../public'), // bundled root
  ];
  const publicDir = candidates.find(p => existsSync(p));
  if (publicDir) {
    await app.register(fastifyStatic, { root: publicDir, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api')) return reply.status(404).send({ error: 'not found' });
      return reply.sendFile('index.html');
    });
  }

  await app.listen({ port, host });
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 7842);
  startServer(port).catch(e => { console.error(e); process.exit(1); });
}
