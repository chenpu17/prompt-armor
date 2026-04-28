import { FastifyInstance } from 'fastify';
import { db, nowMs } from '../db/index.js';
import { nanoid } from 'nanoid';
import { startAutoRun, requestStop } from '../eval/auto-pilot.js';
import { bus } from '../util/bus.js';

export default async function (app: FastifyInstance) {
  app.get('/api/auto-runs', async () => {
    return db.prepare(`
      SELECT ar.*,
        (SELECT COUNT(*) FROM auto_iterations ai WHERE ai.run_id = ar.id) as iter_count,
        bp.title as best_prompt_title
      FROM auto_runs ar
      LEFT JOIN prompts bp ON bp.id = ar.best_prompt_id
      ORDER BY ar.created_at DESC LIMIT 200
    `).all();
  });

  app.get('/api/auto-runs/:id', async (req: any) => {
    const r = db.prepare('SELECT * FROM auto_runs WHERE id = ?').get(req.params.id) as any;
    if (!r) throw app.httpErrors.notFound();
    const iters = db.prepare(`
      SELECT ai.*, p.title as prompt_title, ss.name as sample_set_name
      FROM auto_iterations ai
      LEFT JOIN prompts p ON p.id = ai.prompt_id
      LEFT JOIN sample_sets ss ON ss.id = ai.sample_set_id
      WHERE ai.run_id = ? ORDER BY ai.iter_no ASC
    `).all(req.params.id);
    return { ...r, iterations: iters };
  });

  app.delete('/api/auto-runs/:id', async (req: any) => {
    db.prepare('DELETE FROM auto_iterations WHERE run_id = ?').run(req.params.id);
    db.prepare('DELETE FROM auto_runs WHERE id = ?').run(req.params.id);
    return { ok: true };
  });

  app.post('/api/auto-runs/:id/stop', async (req: any) => {
    requestStop(req.params.id);
    return { ok: true };
  });

  app.post('/api/auto-runs', async (req: any) => {
    const b = req.body || {};
    const {
      name, intent = '', business_context = '一个会触发工具调用的 AI 助手。',
      seed_samples = [],
      generator_model_id, attacker_model_id, target_model_id, judge_model_id,
      max_iterations = 3, pass_threshold = 0.95, early_stop_patience = 2,
      refresh_ratio = 0.3, initial_set_size = 24,
    } = b;
    if (!name) throw app.httpErrors.badRequest('name required');
    if (!Array.isArray(seed_samples) || seed_samples.length === 0)
      throw app.httpErrors.badRequest('seed_samples 不能为空（至少 1 条示例）');

    const get = (id: string, what: string) => {
      const m = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as any;
      if (!m) throw app.httpErrors.badRequest(`${what} 模型不存在: ${id}`);
      return m;
    };
    const generator = get(generator_model_id, '生成器');
    const attacker = get(attacker_model_id, '攻击样本生成');
    const target = get(target_model_id, '被评测目标');
    const judge = get(judge_model_id, '裁判');

    const id = 'ar-' + nanoid(8);
    const now = nowMs();
    db.prepare(`INSERT INTO auto_runs (id,name,intent,business_context,
        generator_model_id,attacker_model_id,target_model_id,judge_model_id,
        max_iterations,pass_threshold,early_stop_patience,refresh_ratio,initial_set_size,
        current_iteration,status,config_json,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, name, intent, business_context,
        generator_model_id, attacker_model_id, target_model_id, judge_model_id,
        max_iterations, pass_threshold, early_stop_patience, refresh_ratio, initial_set_size,
        0, 'pending', JSON.stringify({}), now);

    // fire and forget
    startAutoRun({
      runId: id, name, intent, businessContext: business_context,
      seedSamples: seed_samples,
      generator, attacker, target, judge,
      maxIterations: Math.max(1, Math.min(20, Number(max_iterations) || 3)),
      passThreshold: Math.max(0, Math.min(1, Number(pass_threshold) || 0.95)),
      earlyStopPatience: Math.max(1, Math.min(10, Number(early_stop_patience) || 2)),
      refreshRatio: Math.max(0, Math.min(1, Number(refresh_ratio) || 0.3)),
      initialSetSize: Math.max(6, Math.min(80, Number(initial_set_size) || 24)),
      judgeSystemPromptOverride: (db.prepare("SELECT value FROM settings WHERE key = 'judge_system_prompt'").get() as any)?.value || undefined,
    });

    return { id, status: 'pending' };
  });

  app.get('/api/auto-runs/:id/stream', async (req: any, reply: any) => {
    const id = req.params.id;
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();
    const channel = 'auto:' + id;
    const send = (msg: any) => reply.raw.write(`event: ${msg.event}\ndata: ${JSON.stringify(msg.data)}\n\n`);
    const handler = (msg: any) => send(msg);
    bus.on(channel, handler);

    const row = db.prepare('SELECT * FROM auto_runs WHERE id = ?').get(id) as any;
    if (row) send({ event: 'init', data: row });
    if (row && (row.status === 'done' || row.status === 'failed')) {
      send({ event: 'done', data: { best_prompt_id: row.best_prompt_id, best_score: row.best_score } });
    }

    req.raw.on('close', () => { bus.off(channel, handler); });
    return reply;
  });
}
