import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

export default async function (app: FastifyInstance) {
  app.get('/api/tools', async () => {
    return db.prepare('SELECT * FROM tools ORDER BY danger_level DESC, name ASC').all();
  });

  app.put('/api/tools/:name', async (req: any) => {
    const { name } = req.params;
    const allow = ['description', 'schema_json', 'danger_level', 'mock_response', 'enabled'];
    const fields: string[] = []; const vals: any[] = [];
    for (const k of allow) if (k in (req.body || {})) {
      fields.push(`${k} = ?`);
      vals.push(k === 'enabled' ? (req.body[k] ? 1 : 0) : req.body[k]);
    }
    if (!fields.length) return db.prepare('SELECT * FROM tools WHERE name = ?').get(name);
    vals.push(name);
    db.prepare(`UPDATE tools SET ${fields.join(', ')} WHERE name = ?`).run(...vals);
    return db.prepare('SELECT * FROM tools WHERE name = ?').get(name);
  });
}
