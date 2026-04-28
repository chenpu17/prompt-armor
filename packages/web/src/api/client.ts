const base = '';

async function req(path: string, opts: RequestInit = {}) {
  const headers: any = { ...(opts.headers || {}) };
  const method = (opts.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    if (opts.body == null) opts = { ...opts, body: '{}' };
  }
  const r = await fetch(base + path, { ...opts, headers });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`${r.status} ${txt}`);
  }
  const ct = r.headers.get('content-type') || '';
  return ct.includes('json') ? r.json() : r.text();
}

export const api = {
  // health
  health: () => req('/api/health'),
  // models
  listModels: () => req('/api/models'),
  createModel: (b: any) => req('/api/models', { method: 'POST', body: JSON.stringify(b) }),
  updateModel: (id: string, b: any) => req(`/api/models/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteModel: (id: string) => req(`/api/models/${id}`, { method: 'DELETE' }),
  testModel: (id: string) => req(`/api/models/${id}/test`, { method: 'POST' }),
  // prompts
  listPrompts: () => req('/api/prompts'),
  getPrompt: (id: string) => req(`/api/prompts/${id}`),
  createPrompt: (b: any) => req('/api/prompts', { method: 'POST', body: JSON.stringify(b) }),
  deletePrompt: (id: string) => req(`/api/prompts/${id}`, { method: 'DELETE' }),
  generatePrompt: (b: any) => req('/api/prompts/generate', { method: 'POST', body: JSON.stringify(b) }),
  optimizePrompt: (id: string, b: any) => req(`/api/prompts/${id}/optimize`, { method: 'POST', body: JSON.stringify(b) }),
  // samples
  listSampleSets: () => req('/api/sample-sets'),
  createSampleSet: (b: any) => req('/api/sample-sets', { method: 'POST', body: JSON.stringify(b) }),
  deleteSampleSet: (id: string) => req(`/api/sample-sets/${id}`, { method: 'DELETE' }),
  listSamples: (q: any = {}) => {
    const qs = new URLSearchParams(q).toString();
    return req('/api/samples' + (qs ? '?' + qs : ''));
  },
  createSample: (b: any) => req('/api/samples', { method: 'POST', body: JSON.stringify(b) }),
  deleteSample: (id: string) => req(`/api/samples/${id}`, { method: 'DELETE' }),
  generateSamples: (b: any) => req('/api/samples/generate', { method: 'POST', body: JSON.stringify(b) }),
  // tools
  listTools: () => req('/api/tools'),
  updateTool: (name: string, b: any) => req(`/api/tools/${name}`, { method: 'PUT', body: JSON.stringify(b) }),
  // evaluations
  listEvaluations: () => req('/api/evaluations'),
  getEvaluation: (id: string) => req(`/api/evaluations/${id}`),
  getEvaluationResults: (id: string) => req(`/api/evaluations/${id}/results`),
  startEvaluation: (b: any) => req('/api/evaluations', { method: 'POST', body: JSON.stringify(b) }),
};

export function streamEvaluation(id: string, on: (event: string, data: any) => void) {
  const es = new EventSource(`/api/evaluations/${id}/stream`);
  ['init', 'start', 'progress', 'done', 'error'].forEach(ev => {
    es.addEventListener(ev, (e: any) => {
      try { on(ev, JSON.parse(e.data)); } catch { on(ev, e.data); }
    });
  });
  return () => es.close();
}

export async function streamGenerate(
  path: string,
  body: any,
  on: (evt: any) => void
): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status} ${txt}`);
  }
  const reader = (res.body as any).getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try { on(JSON.parse(line)); } catch { /* ignore malformed */ }
    }
  }
  if (buf.trim()) {
    try { on(JSON.parse(buf.trim())); } catch {}
  }
}
