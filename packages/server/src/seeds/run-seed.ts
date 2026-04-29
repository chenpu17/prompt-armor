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

  // built-in tool profiles — upsert by id so they survive DB restarts
  const profileUpsert = db.prepare(
    'INSERT OR REPLACE INTO tool_profiles (id, name, description, tool_names, is_builtin, created_at) VALUES (?,?,?,?,1,?)'
  );
  const BUILTIN_PROFILES: Array<{ id: string; name: string; description: string; tools: string[] }> = [
    {
      id: 'tp-openclaw',
      name: 'OpenClaw Agent',
      description: '本地智能助手（文件、Shell、网络、记忆、技能），约 22 个工具',
      tools: ['fs_read_file','fs_write_file','fs_list_dir','fs_delete_file','fs_move','fs_copy','fs_chmod',
        'shell_exec','bash','process_list','env_get','network_info',
        'http_request','web_browse','web_search',
        'memory_read','memory_write','config_read','secret_get',
        'skill_list','skill_invoke','skill_install'],
    },
    {
      id: 'tp-coding',
      name: 'Coding Agent',
      description: '代码编写与执行（文件、Shell、代码执行、Git、包管理），约 23 个工具',
      tools: ['fs_read_file','fs_write_file','fs_list_dir','fs_delete_file',
        'str_replace_based_edit_tool','read_file','write_file','list_directory',
        'shell_exec','bash','execute_bash','node_exec','python_exec',
        'web_search','web_browse',
        'db_query','db_exec',
        'git_clone','git_diff','git_commit','git_push',
        'npm_install','pip_install'],
    },
    {
      id: 'tp-browser',
      name: 'Browser Agent',
      description: '浏览器自动化（网页操作、表单、会话数据），约 15 个工具',
      tools: ['web_browse','web_search','http_request',
        'browser_open','browser_click','browser_form_submit','browser_download',
        'cookie_read','local_storage_read',
        'fs_read_file','fs_write_file',
        'file_upload','screen_capture','clipboard_read','oauth_token_get'],
    },
    {
      id: 'tp-enterprise',
      name: 'Enterprise SaaS',
      description: '企业 SaaS 集成（邮件、日历、云存储、数据库、Webhook），约 14 个工具',
      tools: ['email_send','email_read','chat_send',
        'calendar_modify','file_upload',
        'cloud_storage_read','cloud_storage_write',
        'db_query','db_exec',
        'webhook_register','oauth_token_get',
        'memory_read','memory_write','social_post'],
    },
  ];
  const profileTs = nowMs();
  for (const p of BUILTIN_PROFILES) {
    profileUpsert.run(p.id, p.name, p.description, JSON.stringify(p.tools), profileTs);
  }
}
