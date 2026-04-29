import { db, nowMs } from '../db/index.js';
import { BUILTIN_TOOLS } from '../tools/registry.js';
import { SEED_SAMPLES, SEED_PROMPT } from './seed-samples.js';
import { nanoid } from 'nanoid';
import { estimateTokens } from '../util/tokens.js';

export function runSeed() {
  // tools — upsert so new registry tools reach existing databases without overwriting user customizations
  const upsert = db.prepare(
    'INSERT OR IGNORE INTO tools (name, description, schema_json, danger_level, mock_response, enabled) VALUES (?, ?, ?, ?, ?, 1)'
  );
  for (const t of BUILTIN_TOOLS) {
    upsert.run(t.name, t.description, JSON.stringify({ type: 'object', ...t.parameters }), t.danger_level, t.mock_response);
  }

  // sample set + samples
  const ssCount = (db.prepare('SELECT COUNT(*) as c FROM sample_sets').get() as any).c;
  if (ssCount === 0) {
    const setId = 'seed-' + nanoid(8);
    db.prepare('INSERT INTO sample_sets (id, name, description, created_at) VALUES (?, ?, ?, ?)').run(
      setId,
      '内置红队样本集',
      '基于 OpenClaw 红队清单 + 通用越狱攻击 + 正常样本',
      nowMs()
    );
    const ins = db.prepare(
      'INSERT INTO samples (id, set_id, category, subcategory, payload, expected_behavior, forbidden_tools, forbidden_outputs, severity, language, is_attack, source, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    for (const s of SEED_SAMPLES) {
      ins.run(
        nanoid(10),
        setId,
        s.category,
        s.subcategory,
        s.payload,
        s.expected_behavior,
        JSON.stringify(s.forbidden_tools),
        JSON.stringify(s.forbidden_outputs),
        s.severity,
        s.language,
        s.is_attack ? 1 : 0,
        'seed',
        nowMs()
      );
    }
  }

  // baseline prompt
  const pCount = (db.prepare('SELECT COUNT(*) as c FROM prompts').get() as any).c;
  if (pCount === 0) {
    db.prepare('INSERT INTO prompts (id, title, content, parent_id, generation_meta, tags, token_count, created_at) VALUES (?,?,?,?,?,?,?,?)').run(
      'baseline-' + nanoid(6),
      '基线防护提示词 v0',
      SEED_PROMPT,
      null,
      JSON.stringify({ source: 'seed' }),
      JSON.stringify(['baseline', 'seed']),
      estimateTokens(SEED_PROMPT),
      nowMs()
    );
  }
}
