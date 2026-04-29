import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

const VALID_DANGER_LEVELS = new Set(['safe', 'sensitive', 'dangerous']);

export default async function (app: FastifyInstance) {
  app.get('/api/tools', async () => {
    return db.prepare('SELECT * FROM tools ORDER BY danger_level DESC, name ASC').all();
  });

  app.put('/api/tools/:name', async (req: any) => {
    const { name } = req.params;
    const allow = ['description', 'schema_json', 'danger_level', 'mock_response', 'enabled'];
    const fields: string[] = []; const vals: any[] = [];
    for (const k of allow) if (k in (req.body || {})) {
      // Validate schema_json is parseable JSON
      if (k === 'schema_json') {
        try { JSON.parse(req.body[k]); } catch {
          throw app.httpErrors.badRequest('schema_json 必须是合法的 JSON');
        }
      }
      // Validate danger_level enum
      if (k === 'danger_level' && !VALID_DANGER_LEVELS.has(req.body[k])) {
        throw app.httpErrors.badRequest(`danger_level 必须是 ${[...VALID_DANGER_LEVELS].join(' / ')} 之一`);
      }
      fields.push(`${k} = ?`);
      vals.push(k === 'enabled' ? (req.body[k] ? 1 : 0) : req.body[k]);
    }
    if (!fields.length) return db.prepare('SELECT * FROM tools WHERE name = ?').get(name);
    vals.push(name);
    db.prepare(`UPDATE tools SET ${fields.join(', ')} WHERE name = ?`).run(...vals);
    return db.prepare('SELECT * FROM tools WHERE name = ?').get(name);
  });
}
