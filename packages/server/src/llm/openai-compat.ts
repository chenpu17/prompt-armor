// Minimal OpenAI-compatible chat completions client (no SDK, native fetch)
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: any;
  };
}

export interface ModelConfig {
  base_url: string;
  api_key: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  timeout_ms?: number;
}

export interface ChatResult {
  content: string;
  tool_calls: ToolCall[];
  raw: any;
}

export async function chat(
  m: ModelConfig,
  messages: ChatMessage[],
  opts: { tools?: ToolDef[]; tool_choice?: any; response_format?: any; temperature?: number; timeout_ms?: number } = {}
): Promise<ChatResult> {
  const url = m.base_url.replace(/\/$/, '') + '/chat/completions';
  const body: any = {
    model: m.model,
    messages,
    temperature: opts.temperature ?? m.temperature ?? 0.3,
    max_tokens: m.max_tokens ?? 4096,
  };
  if (opts.tools && opts.tools.length) {
    body.tools = opts.tools;
    if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  }
  if (opts.response_format) body.response_format = opts.response_format;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout_ms ?? m.timeout_ms ?? 60000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${m.api_key}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`LLM ${res.status}: ${txt.slice(0, 500)}`);
    }
    const json: any = await res.json();
    const msg = json.choices?.[0]?.message ?? {};
    return {
      content: msg.content ?? '',
      tool_calls: (msg.tool_calls ?? []) as ToolCall[],
      raw: json,
    };
  } finally {
    clearTimeout(t);
  }
}

export function extractJson(text: string): any {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  const candidate = fence ? fence[1] : text;
  try { return JSON.parse(candidate); } catch {}
  // try first {...} or [...]
  const m = candidate.match(/[\[{][\s\S]*[\]}]/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  return null;
}

export interface StreamOpts {
  response_format?: any;
  temperature?: number;
  timeout_ms?: number;
  onDelta?: (delta: string, totalChars: number) => void;
}

export async function chatStream(
  m: ModelConfig,
  messages: ChatMessage[],
  opts: StreamOpts = {}
): Promise<string> {
  const url = m.base_url.replace(/\/$/, '') + '/chat/completions';
  const body: any = {
    model: m.model,
    messages,
    temperature: opts.temperature ?? m.temperature ?? 0.3,
    max_tokens: m.max_tokens ?? 4096,
    stream: true,
  };
  if (opts.response_format) body.response_format = opts.response_format;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout_ms ?? 600000);
  let full = '';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${m.api_key}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) {
      const txt = await res.text().catch(() => '');
      throw new Error(`LLM ${res.status}: ${txt.slice(0, 500)}`);
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
        const line = buf.slice(0, nl).replace(/\r$/, '').trim();
        buf = buf.slice(nl + 1);
        if (!line || !line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            opts.onDelta?.(delta, full.length);
          }
        } catch {
          /* tolerate keep-alive lines */
        }
      }
    }
    return full;
  } finally {
    clearTimeout(t);
  }
}
