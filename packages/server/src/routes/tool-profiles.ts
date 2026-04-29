import { FastifyInstance } from 'fastify';
import { db, nowMs } from '../db/index.js';
import { nanoid } from 'nanoid';

/** Normalize tool_names: accept string (already JSON) or array → always store as JSON array string */
function normalizeToolNames(raw: any): string {
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); return JSON.stringify(Array.isArray(parsed) ? parsed : []); }
    catch { return '[]'; }
  }
  return JSON.stringify(Array.isArray(raw) ? raw : []);
}

export default async function (app: FastifyInstance) {
  app.get('/api/tool-profiles', async () => {
    return db.prepare('SELECT * FROM tool_profiles ORDER BY is_builtin DESC, name ASC').all();
  });

  app.post('/api/tool-profiles', async (req: any) => {
    const { name, description = '', tool_names = [] } = req.body || {};
    if (!name) throw app.httpErrors.badRequest('name 为必填项');
    const id = 'tp-' + nanoid(8);
    db.prepare(
      'INSERT INTO tool_profiles (id,name,description,tool_names,is_builtin,created_at) VALUES (?,?,?,?,?,?)'
    ).run(id, name, description, normalizeToolNames(tool_names), 0, nowMs());
    return db.prepare('SELECT * FROM tool_profiles WHERE id = ?').get(id);
  });

  app.put('/api/tool-profiles/:id', async (req: any) => {
    const { id } = req.params;
    const profile = db.prepare('SELECT * FROM tool_profiles WHERE id = ?').get(id) as any;
    if (!profile) throw app.httpErrors.notFound('档案不存在');
    if (profile.is_builtin) throw app.httpErrors.forbidden('内置档案不可修改');
    const { name, description, tool_names } = req.body || {};
    const fields: string[] = []; const vals: any[] = [];
    if (name !== undefined) { fields.push('name = ?'); vals.push(name); }
    if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
    if (tool_names !== undefined) { fields.push('tool_names = ?'); vals.push(normalizeToolNames(tool_names)); }
    if (!fields.length) return profile;
    vals.push(id);
    db.prepare(`UPDATE tool_profiles SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    return db.prepare('SELECT * FROM tool_profiles WHERE id = ?').get(id);
  });

  app.delete('/api/tool-profiles/:id', async (req: any) => {
    const profile = db.prepare('SELECT * FROM tool_profiles WHERE id = ?').get(req.params.id) as any;
    if (!profile) throw app.httpErrors.notFound('档案不存在');
    if (profile.is_builtin) throw app.httpErrors.forbidden('内置档案不可删除');
    db.prepare('DELETE FROM tool_profiles WHERE id = ?').run(req.params.id);
    return { ok: true };
  });
}
