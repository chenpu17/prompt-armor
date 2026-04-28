import { useEffect, useState } from 'react';
import { api } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import { Plus, Trash2, Zap, Edit3, X, Check } from 'lucide-react';

const PRESETS = [
  { name: 'OpenAI', base_url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'DeepSeek', base_url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: 'Qwen / DashScope', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { name: 'Moonshot Kimi', base_url: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { name: '智谱 GLM', base_url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-air' },
  { name: 'Ollama (本地)', base_url: 'http://localhost:11434/v1', model: 'llama3.1' },
];

export default function Models() {
  const [models, setModels] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [tests, setTests] = useState<Record<string, any>>({});

  async function reload() { setModels(await api.listModels()); }
  useEffect(() => { reload(); }, []);

  async function save() {
    const body = { ...editing };
    if (editing.id) await api.updateModel(editing.id, body);
    else await api.createModel(body);
    setEditing(null); reload();
  }

  async function test(id: string) {
    setTests(t => ({ ...t, [id]: { loading: true } }));
    const r = await api.testModel(id);
    setTests(t => ({ ...t, [id]: r }));
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="模型管理"
        subtitle="为 4 个角色（生成 / 攻击 / 目标 / 裁判）独立配置 OpenAI 兼容模型"
        actions={<button className="btn" onClick={() => setEditing({ name: '', base_url: '', api_key: '', model: '', temperature: 0.3 })}><Plus size={16} />添加模型</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m, i) => (
          <GlowCard key={m.id} delay={i * 0.04}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-lg">{m.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{m.model}</div>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost !p-1.5" onClick={() => setEditing({ ...m })}><Edit3 size={14} /></button>
                <button className="btn-danger !p-1.5" onClick={async () => { if (confirm('删除？')) { await api.deleteModel(m.id); reload(); } }}><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono break-all mb-3">{m.base_url}</div>
            <div className="flex items-center justify-between">
              <button className="btn-ghost" onClick={() => test(m.id)}><Zap size={14} />连通测试</button>
              {tests[m.id] && (
                <div className={`text-xs ${tests[m.id].loading ? 'text-slate-400' : tests[m.id].ok ? 'text-neon' : 'text-magenta'} max-w-[60%] text-right`}>
                  {tests[m.id].loading ? '测试中...' : tests[m.id].ok ? '✓ ' + (tests[m.id].content || 'ok') : (
                    <span title={(tests[m.id].error || '') + (tests[m.id].cause ? '\n' + tests[m.id].cause : '')}>
                      ✗ {tests[m.id].error || '失败'}
                      {tests[m.id].url && <div className="text-[10px] text-slate-500 font-mono break-all mt-1">→ {tests[m.id].url}</div>}
                    </span>
                  )}
                </div>
              )}
            </div>
          </GlowCard>
        ))}
        {!models.length && (
          <GlowCard className="md:col-span-2 lg:col-span-3 text-center py-16 text-slate-500">
            还没有任何模型，点击右上角"添加模型"开始 →
          </GlowCard>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editing.id ? '编辑模型' : '添加模型'}</h2>
              <button className="btn-ghost !p-1.5" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            {!editing.id && (
              <div className="mb-4">
                <div className="label">快速选择预设</div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <button key={p.name} type="button" className="btn-ghost"
                      onClick={() => setEditing((e: any) => ({ ...e, name: p.name, base_url: p.base_url, model: p.model }))}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <Field label="名称（用于识别，如 gpt-4o-judge）"><input className="input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Base URL"><input className="input font-mono text-xs" value={editing.base_url} onChange={e => setEditing({ ...editing, base_url: e.target.value })} placeholder="https://api.openai.com/v1" /></Field>
              <Field label="API Key"><input className="input font-mono text-xs" type="password" value={editing.api_key || ''} onChange={e => setEditing({ ...editing, api_key: e.target.value })} placeholder="sk-..." /></Field>
              <Field label="模型 ID"><input className="input font-mono" value={editing.model} onChange={e => setEditing({ ...editing, model: e.target.value })} placeholder="gpt-4o-mini" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Temperature"><input className="input" type="number" step="0.1" value={editing.temperature ?? 0.3} onChange={e => setEditing({ ...editing, temperature: Number(e.target.value) })} /></Field>
                <Field label="Max Tokens"><input className="input" type="number" value={editing.max_tokens ?? 4096} onChange={e => setEditing({ ...editing, max_tokens: Number(e.target.value) })} /></Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={() => setEditing(null)}>取消</button>
              <button className="btn" onClick={save}><Check size={16} />保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><div className="label">{label}</div>{children}</div>;
}
