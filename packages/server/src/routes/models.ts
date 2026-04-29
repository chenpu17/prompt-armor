import { FastifyInstance } from 'fastify';
import { db, nowMs } from '../db/index.js';
import { nanoid } from 'nanoid';
import { chat } from '../llm/openai-compat.js';

function maskKey(m: any) {
  if (!m) return m;
  const key: string = m.api_key || '';
  return { ...m, api_key: key.length > 8 ? key.slice(0, 4) + '****' + key.slice(-4) : '****' };
}

export default async function (app: FastifyInstance) {
  app.get('/api/models', async () => {
    return (db.prepare('SELECT * FROM models ORDER BY created_at DESC').all() as any[]).map(maskKey);
  });

  app.post('/api/models', async (req: any) => {
    const { name, base_url, api_key, model, temperature = 0.3, max_tokens = 4096, timeout_ms = 60000, notes = '' } = req.body || {};
    if (!name || !base_url || !api_key || !model) throw app.httpErrors.badRequest('缺少必填字段');
    const id = 'm-' + nanoid(8);
    db.prepare(
      'INSERT INTO models (id,name,base_url,api_key,model,temperature,max_tokens,timeout_ms,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(id, name, base_url, api_key, model, temperature, max_tokens, timeout_ms, notes, nowMs());
    return maskKey(db.prepare('SELECT * FROM models WHERE id = ?').get(id));
  });

  app.put('/api/models/:id', async (req: any) => {
    const { id } = req.params;
    const allow = ['name', 'base_url', 'api_key', 'model', 'temperature', 'max_tokens', 'timeout_ms', 'notes'];
    const fields: string[] = [];
    const values: any[] = [];
    for (const k of allow) if (k in (req.body || {})) { fields.push(`${k} = ?`); values.push(req.body[k]); }
    if (!fields.length) return maskKey(db.prepare('SELECT * FROM models WHERE id = ?').get(id));
    values.push(id);
    db.prepare(`UPDATE models SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return maskKey(db.prepare('SELECT * FROM models WHERE id = ?').get(id));
  });

  app.delete('/api/models/:id', async (req: any) => {
    db.prepare('DELETE FROM models WHERE id = ?').run(req.params.id);
    return { ok: true };
  });

  app.post('/api/models/:id/test', async (req: any) => {
    const m = db.prepare('SELECT * FROM models WHERE id = ?').get(req.params.id) as any;
    if (!m) throw app.httpErrors.notFound('模型不存在');
    const url = (m.base_url || '').replace(/\/$/, '') + '/chat/completions';
    try {
      const r = await chat({ ...m, timeout_ms: Math.min(m.timeout_ms ?? 60000, 20000) }, [{ role: 'user', content: 'ping, reply "pong"' }], { temperature: 0 });
      return { ok: true, url, content: r.content?.slice(0, 200) || '(empty)' };
    } catch (e: any) {
      return { ok: false, url, error: String(e?.message || e), cause: e?.cause ? String(e.cause?.code || e.cause?.message || e.cause) : undefined };
    }
  });
}
