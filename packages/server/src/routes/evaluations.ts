import { FastifyInstance } from 'fastify';
import { db, nowMs } from '../db/index.js';
import { nanoid } from 'nanoid';
import { runEvaluation } from '../eval/runner.js';
import { toToolDef } from '../tools/registry.js';
import { bus } from '../util/bus.js';

export default async function (app: FastifyInstance) {
  app.get('/api/evaluations', async () => {
    return db.prepare(`
      SELECT e.*, p.title as prompt_title, ss.name as sample_set_name
      FROM evaluations e
      LEFT JOIN prompts p ON p.id = e.prompt_id
      LEFT JOIN sample_sets ss ON ss.id = e.sample_set_id
      ORDER BY e.created_at DESC LIMIT 200
    `).all();
  });

  app.get('/api/evaluations/:id', async (req: any) => {
    const e = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(req.params.id) as any;
    if (!e) throw app.httpErrors.notFound();
    return e;
  });

  app.get('/api/evaluations/:id/results', async (req: any) => {
    const rows = db.prepare(`
      SELECT er.*, s.payload, s.category, s.subcategory, s.severity, s.expected_behavior
      FROM evaluation_results er LEFT JOIN samples s ON s.id = er.sample_id
      WHERE er.evaluation_id = ? ORDER BY er.created_at ASC
    `).all(req.params.id);
    return rows;
  });

  app.post('/api/evaluations', async (req: any) => {
    const { prompt_id, sample_set_id, target_model_id, judge_model_id, concurrency = 4, sample_filter, profile_id, profile_ids } = req.body || {};
    const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(prompt_id) as any;
    const setRow = db.prepare('SELECT * FROM sample_sets WHERE id = ?').get(sample_set_id) as any;
    const tgt = db.prepare('SELECT * FROM models WHERE id = ?').get(target_model_id) as any;
    const jud = db.prepare('SELECT * FROM models WHERE id = ?').get(judge_model_id) as any;
    if (!prompt || !setRow || !tgt || !jud) throw app.httpErrors.badRequest('参数不完整');
    let sampleRows = db.prepare('SELECT * FROM samples WHERE set_id = ?').all(sample_set_id) as any[];
    if (sample_filter?.is_attack !== undefined) sampleRows = sampleRows.filter(s => s.is_attack === (sample_filter.is_attack ? 1 : 0));
    if (sample_filter?.categories?.length) sampleRows = sampleRows.filter(s => sample_filter.categories.includes(s.category));

    const samples = sampleRows.map(s => ({
      id: s.id, payload: s.payload, expected_behavior: s.expected_behavior,
      forbidden_tools: JSON.parse(s.forbidden_tools || '[]'),
      forbidden_outputs: JSON.parse(s.forbidden_outputs || '[]'),
      is_attack: !!s.is_attack, category: s.category, severity: s.severity,
    }));

    // Resolve tools: profile_ids (multi-select union) OR profile_id (legacy) → subset; empty → all enabled
    let allEnabledTools = (db.prepare('SELECT * FROM tools WHERE enabled = 1').all() as any[])
      .map(toToolDef).filter((t): t is NonNullable<ReturnType<typeof toToolDef>> => t !== null);
    let tools = allEnabledTools;
    // Normalize: support both profile_ids array (new) and profile_id string (legacy)
    const pids: string[] = Array.isArray(profile_ids) && profile_ids.length > 0
      ? profile_ids
      : (profile_id ? [profile_id] : []);
    if (pids.length > 0) {
      const allowedNames = new Set<string>();
      for (const pid of pids) {
        const profile = db.prepare('SELECT * FROM tool_profiles WHERE id = ?').get(pid) as any;
        if (profile) {
          for (const n of JSON.parse(profile.tool_names || '[]') as string[]) allowedNames.add(n);
        }
      }
      if (allowedNames.size > 0) tools = allEnabledTools.filter(t => allowedNames.has(t.function.name));
    }

    const evalId = 'e-' + nanoid(10);
    const profileIdsJson = pids.length ? JSON.stringify(pids) : null;
    db.prepare('INSERT INTO evaluations (id,prompt_id,sample_set_id,target_model_id,judge_model_id,status,profile_id,profile_ids,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(evalId, prompt_id, sample_set_id, target_model_id, judge_model_id, 'pending', pids[0] || null, profileIdsJson, nowMs());

    const judgeOverrideRow = db.prepare("SELECT value FROM settings WHERE key = 'judge_system_prompt'").get() as any;
    const judgeSystemPromptOverride = judgeOverrideRow?.value || undefined;

    runEvaluation({
      evaluationId: evalId,
      promptContent: prompt.content,
      samples, tools,
      targetModel: tgt,
      judgeModel: jud,
      judgeSystemPromptOverride,
      concurrency,
    }).catch(e => {
      db.prepare('UPDATE evaluations SET status = ?, metrics_json = ? WHERE id = ?')
        .run('failed', JSON.stringify({ error: String(e?.message || e) }), evalId);
    });

    return { id: evalId, status: 'pending', total: samples.length, tool_count: tools.length };
  });

  app.get('/api/evaluations/:id/stream', async (req: any, reply) => {
    const id = req.params.id;
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();
    const channel = 'eval:' + id;
    const send = (msg: any) => reply.raw.write(`event: ${msg.event}\ndata: ${JSON.stringify(msg.data)}\n\n`);
    const handler = (msg: any) => send(msg);
    bus.on(channel, handler);

    // initial state
    const evalRow = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id) as any;
    if (evalRow) send({ event: 'init', data: evalRow });
    if (evalRow?.status === 'done' || evalRow?.status === 'failed') {
      send({ event: 'done', data: { metrics: evalRow.metrics_json ? JSON.parse(evalRow.metrics_json) : {} } });
    }

    req.raw.on('close', () => { bus.off(channel, handler); });
    return reply;
  });
}
