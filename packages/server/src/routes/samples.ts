import { FastifyInstance } from 'fastify';
import { db, nowMs } from '../db/index.js';
import { nanoid } from 'nanoid';
import { generateSamples, generateSamplesStream } from '../roles/attack-sample-gen.js';

function openNdjson(reply: any) {
  reply.raw.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
  reply.raw.setHeader('X-Accel-Buffering', 'no');
  reply.raw.flushHeaders?.();
  return (obj: any) => reply.raw.write(JSON.stringify(obj) + '\n');
}

export default async function (app: FastifyInstance) {
  app.get('/api/sample-sets', async () => {
    const sets = db.prepare('SELECT * FROM sample_sets ORDER BY created_at DESC').all() as any[];
    return sets.map(s => ({
      ...s,
      sample_count: (db.prepare('SELECT COUNT(*) as c FROM samples WHERE set_id = ?').get(s.id) as any).c,
    }));
  });

  app.post('/api/sample-sets', async (req: any) => {
    const { name, description = '' } = req.body || {};
    if (!name) throw app.httpErrors.badRequest('name required');
    const id = 'ss-' + nanoid(8);
    db.prepare('INSERT INTO sample_sets (id,name,description,created_at) VALUES (?,?,?,?)').run(id, name, description, nowMs());
    return db.prepare('SELECT * FROM sample_sets WHERE id = ?').get(id);
  });

  app.delete('/api/sample-sets/:id', async (req: any) => {
    db.prepare('DELETE FROM samples WHERE set_id = ?').run(req.params.id);
    db.prepare('DELETE FROM sample_sets WHERE id = ?').run(req.params.id);
    return { ok: true };
  });

  app.get('/api/samples', async (req: any) => {
    const { set_id, category, is_attack } = req.query || {};
    const conds: string[] = []; const vals: any[] = [];
    if (set_id) { conds.push('set_id = ?'); vals.push(set_id); }
    if (category) { conds.push('category = ?'); vals.push(category); }
    if (is_attack !== undefined && is_attack !== '') { conds.push('is_attack = ?'); vals.push(Number(is_attack)); }
    const sql = 'SELECT * FROM samples' + (conds.length ? ' WHERE ' + conds.join(' AND ') : '') + ' ORDER BY created_at DESC LIMIT 1000';
    return db.prepare(sql).all(...vals);
  });

  app.post('/api/samples', async (req: any) => {
    const { set_id, category, subcategory = '', payload, expected_behavior = '', forbidden_tools = [], forbidden_outputs = [], severity = 'medium', language = 'zh', is_attack = true } = req.body || {};
    if (!payload || !category) throw app.httpErrors.badRequest('payload + category required');
    const id = nanoid(10);
    db.prepare('INSERT INTO samples (id,set_id,category,subcategory,payload,expected_behavior,forbidden_tools,forbidden_outputs,severity,language,is_attack,source,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, set_id, category, subcategory, payload, expected_behavior, JSON.stringify(forbidden_tools), JSON.stringify(forbidden_outputs), severity, language, is_attack ? 1 : 0, 'manual', nowMs());
    return db.prepare('SELECT * FROM samples WHERE id = ?').get(id);
  });

  app.delete('/api/samples/:id', async (req: any) => {
    db.prepare('DELETE FROM samples WHERE id = ?').run(req.params.id);
    return { ok: true };
  });

  function buildSampleGenContext(body: any) {
    const { generator_model_id, set_id, target_set_name, business_context, categories, count_per_category = 5, languages = ['zh', 'en'], include_benign = true, benign_count = 5, intent, source_set_ids, prompt_id } = body || {};
    const gen = db.prepare('SELECT * FROM models WHERE id = ?').get(generator_model_id) as any;
    if (!gen) throw new Error('生成模型不存在');
    const tools = (db.prepare('SELECT name, danger_level, description FROM tools WHERE enabled = 1').all() as any[]);

    let reference: any[] = [];
    if (Array.isArray(source_set_ids) && source_set_ids.length) {
      const ph = source_set_ids.map(() => '?').join(',');
      const rows = db.prepare(`SELECT category, payload, expected_behavior FROM samples WHERE set_id IN (${ph}) ORDER BY RANDOM() LIMIT 15`).all(...source_set_ids) as any[];
      reference = rows;
    }

    let protectPrompt: string | undefined;
    if (prompt_id) {
      const p = db.prepare('SELECT content FROM prompts WHERE id = ?').get(prompt_id) as any;
      protectPrompt = p?.content;
    }

    const input = {
      business_context: business_context || '一个会触发工具调用的 AI 助手。',
      categories: categories || [],
      count_per_category, languages, include_benign, benign_count,
      available_tools: tools,
      intent,
      reference_samples: reference,
      protect_prompt: protectPrompt,
    };
    return { gen, input, set_id, target_set_name, prompt_id, intent };
  }

  function persistGeneratedSamples(samples: any[], ctx: ReturnType<typeof buildSampleGenContext>) {
    let targetSet = ctx.set_id;
    if (!targetSet) {
      targetSet = 'ss-' + nanoid(8);
      const name = ctx.target_set_name || (ctx.prompt_id ? '评测集 · ' + new Date().toLocaleString('zh-CN') : '生成 ' + new Date().toLocaleString('zh-CN'));
      const desc = ctx.prompt_id ? `针对提示词 ${ctx.prompt_id} 生成的评测集` : (ctx.intent ? `根据描述生成: ${String(ctx.intent).slice(0, 80)}` : `生成于 ${new Date().toISOString()}`);
      db.prepare('INSERT INTO sample_sets (id,name,description,created_at) VALUES (?,?,?,?)').run(targetSet, name, desc, nowMs());
    }
    const ins = db.prepare('INSERT INTO samples (id,set_id,category,subcategory,payload,expected_behavior,forbidden_tools,forbidden_outputs,severity,language,is_attack,source,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
    for (const s of samples) {
      ins.run(nanoid(10), targetSet, s.category, s.subcategory, s.payload, s.expected_behavior,
        JSON.stringify(s.forbidden_tools), JSON.stringify(s.forbidden_outputs), s.severity, s.language, s.is_attack ? 1 : 0, ctx.prompt_id ? 'from_prompt' : 'generated', nowMs());
    }
    return targetSet;
  }

  app.post('/api/samples/generate', async (req: any) => {
    const ctx = buildSampleGenContext(req.body);
    const samples = await generateSamples(ctx.gen, ctx.input);
    const targetSet = persistGeneratedSamples(samples, ctx);
    return { set_id: targetSet, generated: samples.length };
  });

  app.post('/api/samples/generate-stream', async (req: any, reply: any) => {
    const send = openNdjson(reply);
    try {
      const ctx = buildSampleGenContext(req.body);
      send({ type: 'start', model: ctx.gen.name });
      const samples = await generateSamplesStream(ctx.gen, ctx.input, (_delta, total) => {
        send({ type: 'token', total_chars: total });
      });
      const targetSet = persistGeneratedSamples(samples, ctx);
      send({ type: 'done', set_id: targetSet, generated: samples.length });
    } catch (e: any) {
      send({ type: 'error', message: String(e?.message || e) });
    } finally {
      reply.raw.end();
    }
  });
}
