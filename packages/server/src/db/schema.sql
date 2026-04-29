CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature REAL DEFAULT 0.3,
  max_tokens INTEGER DEFAULT 4096,
  timeout_ms INTEGER DEFAULT 60000,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  parent_id TEXT,
  generation_meta TEXT,
  tags TEXT,
  token_count INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sample_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS samples (
  id TEXT PRIMARY KEY,
  set_id TEXT,
  category TEXT,
  subcategory TEXT,
  payload TEXT NOT NULL,
  expected_behavior TEXT,
  forbidden_tools TEXT,
  forbidden_outputs TEXT,
  severity TEXT,
  language TEXT,
  is_attack INTEGER DEFAULT 1,
  source TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tools (
  name TEXT PRIMARY KEY,
  description TEXT,
  schema_json TEXT NOT NULL,
  danger_level TEXT,
  mock_response TEXT,
  enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  prompt_id TEXT,
  sample_set_id TEXT,
  target_model_id TEXT,
  judge_model_id TEXT,
  status TEXT,
  metrics_json TEXT,
  created_at INTEGER NOT NULL,
  finished_at INTEGER
);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT,
  sample_id TEXT,
  target_response TEXT,
  tool_calls_json TEXT,
  refused INTEGER,
  hit_forbidden_tool INTEGER,
  leaked_keywords TEXT,
  judge_score REAL,
  judge_reason TEXT,
  is_attack INTEGER,
  passed INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS optimizations (
  id TEXT PRIMARY KEY,
  from_prompt_id TEXT,
  to_prompt_id TEXT,
  evaluation_id TEXT,
  generator_model_id TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_samples_set ON samples(set_id);
CREATE INDEX IF NOT EXISTS idx_results_eval ON evaluation_results(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_prompts_parent ON prompts(parent_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auto_runs (
  id TEXT PRIMARY KEY,
  name TEXT,
  intent TEXT,
  business_context TEXT,
  generator_model_id TEXT,
  attacker_model_id TEXT,
  target_model_id TEXT,
  judge_model_id TEXT,
  max_iterations INTEGER NOT NULL DEFAULT 3,
  pass_threshold REAL NOT NULL DEFAULT 0.95,
  early_stop_patience INTEGER NOT NULL DEFAULT 2,
  refresh_ratio REAL NOT NULL DEFAULT 0.3,
  initial_set_size INTEGER NOT NULL DEFAULT 24,
  current_iteration INTEGER DEFAULT 0,
  status TEXT,
  best_prompt_id TEXT,
  best_score REAL,
  config_json TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  finished_at INTEGER
);

CREATE TABLE IF NOT EXISTS auto_iterations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  iter_no INTEGER NOT NULL,
  prompt_id TEXT,
  sample_set_id TEXT,
  evaluation_id TEXT,
  metrics_json TEXT,
  notes TEXT,
  status TEXT,
  created_at INTEGER NOT NULL,
  finished_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auto_iters_run ON auto_iterations(run_id);
