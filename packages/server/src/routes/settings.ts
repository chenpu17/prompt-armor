import { FastifyInstance } from 'fastify';
import { db, nowMs } from '../db/index.js';
import { DEFAULT_JUDGE_SYSTEM_PROMPT } from '../roles/judge.js';

const KNOWN_KEYS: Record<string, { default: string; description: string }> = {
  judge_system_prompt: {
    default: DEFAULT_JUDGE_SYSTEM_PROMPT,
    description: '评测裁判模型的 system prompt。留空则使用内置默认。',
  },
};

export default async function (app: FastifyInstance) {
  app.get('/api/settings', async () => {
    const rows = db.prepare('SELECT key, value, updated_at FROM settings').all() as any[];
    const map: Record<string, any> = {};
    for (const r of rows) map[r.key] = { value: r.value, updated_at: r.updated_at };
    const out: any = {};
    for (const k of Object.keys(KNOWN_KEYS)) {
      out[k] = {
        value: map[k]?.value ?? '',
        default: KNOWN_KEYS[k].default,
        description: KNOWN_KEYS[k].description,
        updated_at: map[k]?.updated_at ?? null,
      };
    }
    return out;
  });

  app.put('/api/settings/:key', async (req: any) => {
    const { key } = req.params;
    if (!KNOWN_KEYS[key]) throw app.httpErrors.badRequest('未知设置项: ' + key);
    const value = String(req.body?.value ?? '');
    const existing = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
    if (existing) {
      db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?').run(value, nowMs(), key);
    } else {
      db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?,?,?)').run(key, value, nowMs());
    }
    return { ok: true, key, value };
  });

  app.delete('/api/settings/:key', async (req: any) => {
    db.prepare('DELETE FROM settings WHERE key = ?').run(req.params.key);
    return { ok: true };
  });
}
