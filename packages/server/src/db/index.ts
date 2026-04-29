import Database from 'better-sqlite3';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const dataDir = process.env.PROMPT_ARMOR_DATA_DIR || join(homedir(), '.prompt-armor');
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'data.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPaths = [
  join(__dirname, 'schema.sql'),           // tsc output: dist/server/db/
  join(__dirname, 'db/schema.sql'),        // esbuild bundle: dist/server/
  join(__dirname, '../../src/db/schema.sql'), // dev fallback
];
const schemaPath = schemaPaths.find(p => existsSync(p))!;
const schema = readFileSync(schemaPath, 'utf-8');
db.exec(schema);

export function nowMs() { return Date.now(); }
