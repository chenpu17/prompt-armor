import { FastifyInstance } from 'fastify';
import { db, nowMs } from '../db/index.js';
import { nanoid } from 'nanoid';
import { generatePrompt, generatePromptStream } from '../roles/prompt-generator.js';

function deriveFromSourceSets(source_set_ids: string[] | undefined, attack_categories: string[] | undefined) {
  let cats = attack_categories;
  let referenceSamples: any[] = [];
  if (Array.isArray(source_set_ids) && source_set_ids.length) {
    const ph = source_set_ids.map(() => '?').join(',');
    referenceSamples = db.prepare(
      `SELECT category, payload, expected_behavior, is_attack FROM samples WHERE set_id IN (${ph}) ORDER BY RANDOM() LIMIT 30`
    ).all(...source_set_ids) as any[];
    if (!cats?.length) {
      const rows = db.prepare(`SELECT DISTINCT category FROM samples WHERE set_id IN (${ph}) AND is_attack = 1`).all(...source_set_ids) as any[];
      cats = rows.map(r => r.category).filter(Boolean);
    }
  }
  return { cats: cats || [], referenceSamples };
}

function openNdjson(reply: any) {
  reply.raw.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
  reply.raw.setHeader('X-Accel-Buffering', 'no');
  reply.raw.flushHeaders?.();
  return (obj: any) => reply.raw.write(JSON.stringify(obj) + '\n');
}

export default async function (app: FastifyInstance) {
  app.get('/api/prompts', async () => {
    return db.prepare('SELECT id, title, parent_id, tags, created_at, substr(content,1,200) as preview FROM prompts ORDER BY created_at DESC').all();
  });

  app.get('/api/prompts/:id', async (req: any) => {
    const p = db.prepare('SELECT * FROM prompts WHERE id = ?').get(req.params.id);
    if (!p) throw app.httpErrors.notFound();
    return p;
  });

  app.post('/api/prompts', async (req: any) => {
    const { title, content, parent_id = null, tags = [], generation_meta = null } = req.body || {};
    if (!content) throw app.httpErrors.badRequest('content required');
    const id = 'p-' + nanoid(8);
    db.prepare('INSERT INTO prompts (id,title,content,parent_id,generation_meta,tags,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(id, title || '未命名', content, parent_id, generation_meta ? JSON.stringify(generation_meta) : null, JSON.stringify(tags), nowMs());
    return db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
  });

  app.delete('/api/prompts/:id', async (req: any) => {
    db.prepare('DELETE FROM prompts WHERE id = ?').run(req.params.id);
    return { ok: true };
  });

  app.put('/api/prompts/:id', async (req: any) => {
    const id = req.params.id;
    const exists = db.prepare('SELECT id FROM prompts WHERE id = ?').get(id);
    if (!exists) throw app.httpErrors.notFound();
    const fields: any = {};
    if (typeof req.body?.title === 'string') fields.title = req.body.title.trim() || '未命名';
    if (typeof req.body?.content === 'string') fields.content = req.body.content;
    if (Array.isArray(req.body?.tags)) fields.tags = JSON.stringify(req.body.tags);
    if (Object.keys(fields).length === 0) return { ok: true };
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE prompts SET ${sets} WHERE id = ?`).run(...Object.values(fields), id);
    return db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
  });

  function prepareGen(body: any) {
    const { generator_model_id, business_context, attack_categories, base_prompt_id, extra_requirements, title, source_set_ids, known_tool_context } = body || {};
    const gen = db.prepare('SELECT * FROM models WHERE id = ?').get(generator_model_id) as any;
    if (!gen) throw new Error('生成模型不存在');
    let basePrompt = '';
    if (base_prompt_id) {
      const bp = db.prepare('SELECT content FROM prompts WHERE id = ?').get(base_prompt_id) as any;
      basePrompt = bp?.content || '';
    }
    const { cats, referenceSamples } = deriveFromSourceSets(source_set_ids, attack_categories);
    return {
      gen, title, base_prompt_id, source_set_ids, business_context, extra_requirements, known_tool_context,
      input: {
        business_context: business_context || '一个会触发工具调用的 AI 助手。',
        attack_categories: cats,
        known_tool_context: known_tool_context || '',
        base_prompt: basePrompt,
        extra_requirements,
        reference_samples: referenceSamples,
      },
      cats,
    };
  }

  function deriveAutoTitle(ctx: ReturnType<typeof prepareGen>): string {
    if (ctx.title && ctx.title.trim()) return ctx.title.trim();
    const cats = ctx.cats || [];
    const ts = new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    if (cats.length >= 1 && cats.length <= 3) return `防护提示词 · ${cats.join('/')} · ${ts}`;
    if (cats.length > 3) return `防护提示词 · ${cats.length} 类 · ${ts}`;
    if (ctx.source_set_ids?.length) return `防护提示词 · 基于样本集 · ${ts}`;
    return `防护提示词 · ${ts}`;
  }

  function persistPrompt(content: string, ctx: ReturnType<typeof prepareGen>) {
    const id = 'p-' + nanoid(8);
    db.prepare('INSERT INTO prompts (id,title,content,parent_id,generation_meta,tags,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(id, deriveAutoTitle(ctx), content, ctx.base_prompt_id || null,
        JSON.stringify({ generator_model_id: ctx.gen.id, business_context: ctx.business_context, attack_categories: ctx.cats, source_set_ids: ctx.source_set_ids, known_tool_context: ctx.known_tool_context || undefined }),
        JSON.stringify(ctx.source_set_ids?.length ? ['generated', 'from_samples'] : ['generated']), nowMs());
    return db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
  }

  app.post('/api/prompts/generate', async (req: any) => {
    const ctx = prepareGen(req.body);
    const content = await generatePrompt(ctx.gen, ctx.input);
    return persistPrompt(content, ctx);
  });

  app.post('/api/prompts/generate-stream', async (req: any, reply: any) => {
    const send = openNdjson(reply);
    try {
      const ctx = prepareGen(req.body);
      send({ type: 'start', model: ctx.gen.name, derived: { categories: ctx.cats } });
      const content = await generatePromptStream(ctx.gen, ctx.input, (_d, total) => send({ type: 'token', total_chars: total }));
      const saved = persistPrompt(content, ctx) as any;
      send({ type: 'done', prompt: saved });
    } catch (e: any) {
      send({ type: 'error', message: String(e?.message || e) });
    } finally {
      reply.raw.end();
    }
  });

  app.post('/api/prompts/:id/optimize', async (req: any) => {
    const baseId = req.params.id;
    const { generator_model_id, evaluation_id, business_context, attack_categories, forbidden_tools, extra_requirements, title } = req.body || {};
    const gen = db.prepare('SELECT * FROM models WHERE id = ?').get(generator_model_id) as any;
    if (!gen) throw app.httpErrors.badRequest('生成模型不存在');
    const base = db.prepare('SELECT * FROM prompts WHERE id = ?').get(baseId) as any;
    if (!base) throw app.httpErrors.notFound('基础 prompt 不存在');

    let failures: any[] = [];
    if (evaluation_id) {
      const rows = db.prepare(`
        SELECT er.*, s.payload, s.expected_behavior FROM evaluation_results er
        LEFT JOIN samples s ON s.id = er.sample_id
        WHERE er.evaluation_id = ? AND er.passed = 0
        ORDER BY er.judge_score ASC LIMIT 30
      `).all(evaluation_id) as any[];
      failures = rows.map(r => ({
        payload: r.payload,
        target_response: r.target_response,
        tool_calls: JSON.parse(r.tool_calls_json || '[]'),
        reason: r.judge_reason,
      }));
    }

    const content = await generatePrompt(gen, {
      business_context: business_context || '一个会触发工具调用的 AI 助手。',
      attack_categories: attack_categories || [],
      forbidden_tools: forbidden_tools || [],
      base_prompt: base.content,
      failure_cases: failures,
      extra_requirements,
    });
    const id = 'p-' + nanoid(8);
    db.prepare('INSERT INTO prompts (id,title,content,parent_id,generation_meta,tags,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(id, title || (base.title || '提示词') + ' · 优化', content, baseId,
        JSON.stringify({ generator_model_id, evaluation_id, failure_count: failures.length }),
        JSON.stringify(['optimized']), nowMs());
    if (evaluation_id) {
      db.prepare('INSERT INTO optimizations (id,from_prompt_id,to_prompt_id,evaluation_id,generator_model_id,notes,created_at) VALUES (?,?,?,?,?,?,?)')
        .run('o-' + nanoid(6), baseId, id, evaluation_id, generator_model_id, `修复 ${failures.length} 个失败用例`, nowMs());
    }
    return db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
  });
}
