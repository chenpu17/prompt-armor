import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

import './db/index.js'; // initialize DB
import { runSeed } from './seeds/run-seed.js';
import modelsRoute from './routes/models.js';
import promptsRoute from './routes/prompts.js';
import samplesRoute from './routes/samples.js';
import toolsRoute from './routes/tools.js';
import evaluationsRoute from './routes/evaluations.js';
import settingsRoute from './routes/settings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  app.get('/api/health', async () => ({ ok: true, version: '0.1.0' }));

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 7842);
  startServer(port).catch(e => { console.error(e); process.exit(1); });
}
