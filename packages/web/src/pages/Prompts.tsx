import { useState } from 'react';
import { api, streamGenerate } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import { Sparkles, Eye, Trash2, X, GitBranch, Copy, ChevronDown, Pencil } from 'lucide-react';
import { useStore } from '../store';

const ATTACK_CATS = [
  'filesystem.read', 'filesystem.write', 'command.exec', 'network.info',
  'env.leak', 'secret.leak', 'prompt.leak', 'prompt.injection',
  'indirect.injection', 'content.harmful',
];

export default function Prompts() {
  const list = useStore(s => s.prompts);
  const models = useStore(s => s.models);
  const sets = useStore(s => s.sampleSets);
  const refresh = useStore(s => s.refresh);
  const [view, setView] = useState<any | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [genOpen, setGenOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [genForm, setGenForm] = useState<any>({
    generator_model_id: '',
    business_context: '一个接入工具调用的 AI 助手（如 Agent 类应用），运行在受控环境中，具备读写文件、执行命令、调用 API 等能力。',
    attack_categories: [], known_tool_context: '', extra_requirements: '', title: '',
    source_set_ids: [] as string[],
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ chars: number; status: string; derived?: any } | null>(null);

  async function commitRename(id: string) {
    const v = renameVal.trim();
    if (v) {
      try { await api.updatePrompt(id, { title: v }); await refresh('prompts'); }
      catch (e: any) { alert('重命名失败: ' + e.message); }
    }
    setRenameId(null); setRenameVal('');
  }

  async function generate() {
    setGenerating(true);
    setProgress({ chars: 0, status: '连接中…' });
    try {
      const payload: any = { ...genForm };
      if (!advanced) payload.attack_categories = [];
      let lastErr = '';
      await streamGenerate('/api/prompts/generate-stream', payload, (e: any) => {
        if (e.type === 'start') setProgress({ chars: 0, status: '模型已启动 · ' + e.model, derived: e.derived });
        else if (e.type === 'token') setProgress(p => ({ ...(p || { status: '接收中' }), chars: e.total_chars, status: '接收中' }));
        else if (e.type === 'done') setProgress(p => ({ ...(p || { chars: 0 }), status: '完成 ✓' }));
        else if (e.type === 'error') lastErr = e.message;
      });
      if (lastErr) throw new Error(lastErr);
      await refresh('prompts');
      setGenOpen(false);
    } catch (e: any) {
      alert('生成失败: ' + e.message);
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(null), 1500);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="防护提示词"
        subtitle="管理系统级安全提示词的版本树，支持 AI 生成、基于失败用例优化"
        actions={<button className="btn" onClick={() => setGenOpen(true)}><Sparkles size={16} />AI 生成</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((p: any, i: number) => (
          <GlowCard key={p.id} delay={i * 0.03}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {p.parent_id && <GitBranch size={14} className="text-magenta shrink-0" />}
                  {renameId === p.id ? (
                    <input
                      autoFocus
                      className="input !py-1 !px-2 text-sm flex-1"
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onBlur={() => commitRename(p.id)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(p.id); if (e.key === 'Escape') { setRenameId(null); setRenameVal(''); } }}
                    />
                  ) : (
                    <div className="font-semibold truncate cursor-text" title="点击右侧 ✎ 重命名">{p.title}</div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{p.id} · {new Date(p.created_at).toLocaleString('zh-CN')}</div>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost !p-1.5" title="重命名" onClick={() => { setRenameId(p.id); setRenameVal(p.title || ''); }}><Pencil size={14} /></button>
                <button className="btn-ghost !p-1.5" onClick={async () => setView(await api.getPrompt(p.id))}><Eye size={14} /></button>
                <button className="btn-danger !p-1.5" onClick={async () => { if (confirm('删除？')) { await api.deletePrompt(p.id); await refresh('prompts'); } }}><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="text-xs text-slate-400 line-clamp-3 whitespace-pre-wrap font-mono">{p.preview}…</div>
            {p.tags && JSON.parse(p.tags).length > 0 && (
              <div className="flex gap-1 mt-3">
                {JSON.parse(p.tags).map((t: string) => <span key={t} className="badge badge-low">{t}</span>)}
              </div>
            )}
          </GlowCard>
        ))}
      </div>

      {view && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 max-w-3xl w-full max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-spaceDeep/80 backdrop-blur py-2 -mt-2 z-10">
              <h2 className="text-xl font-semibold">{view.title}</h2>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(view.content); }}><Copy size={14} />复制</button>
                <button className="btn-ghost !p-1.5" onClick={() => setView(null)}><X size={16} /></button>
              </div>
            </div>
            <pre className="text-xs whitespace-pre-wrap font-mono text-slate-300 leading-relaxed">{view.content}</pre>
          </div>
        </div>
      )}

      {genOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 max-w-2xl w-full max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="text-neon" size={20} />AI 生成防护提示词</h2>
              <button className="btn-ghost !p-1.5" onClick={() => setGenOpen(false)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="label">生成模型 (PromptGenerator)</div>
                <select className="input" value={genForm.generator_model_id} onChange={e => setGenForm({ ...genForm, generator_model_id: e.target.value })}>
                  <option value="">— 请选择 —</option>
                  {models.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.model})</option>)}
                </select>
              </div>
              <div>
                <div className="label">应用业务背景</div>
                <textarea className="input min-h-[80px]" value={genForm.business_context} onChange={e => setGenForm({ ...genForm, business_context: e.target.value })} />
              </div>
              <div>
                <div className="label">参考样本集 — 系统将从中自动分析需要防御的类别与工具</div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto p-2 bg-black/30 rounded-lg">
                  {sets.length === 0 && <div className="text-xs text-slate-500">暂无样本集，请先到「样本」页面创建或生成</div>}
                  {sets.map((s: any) => {
                    const on = genForm.source_set_ids.includes(s.id);
                    return <button key={s.id} type="button" className={`badge ${on ? 'badge-dangerous' : 'badge-low'} cursor-pointer`}
                      onClick={() => setGenForm((f: any) => ({ ...f, source_set_ids: on ? f.source_set_ids.filter((x: string) => x !== s.id) : [...f.source_set_ids, s.id] }))}>{s.name} ({s.sample_count})</button>;
                  })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {genForm.source_set_ids.length
                    ? `已选 ${genForm.source_set_ids.length} 个样本集，将自动派生攻击类别与禁用工具`
                    : '未选 — 将基于业务背景与默认安全策略生成（建议至少选 1 个样本集）'}
                </div>
              </div>
              <div>
                <div className="label">额外要求（可选）</div>
                <textarea className="input min-h-[60px]" value={genForm.extra_requirements} onChange={e => setGenForm({ ...genForm, extra_requirements: e.target.value })} placeholder="如：必须用中文、不能超过 800 字..." />
              </div>

              <details className="border border-white/10 rounded-lg" open={advanced} onToggle={(e: any) => setAdvanced(e.target.open)}>
                <summary className="cursor-pointer px-3 py-2 text-xs text-slate-400 flex items-center gap-2 select-none">
                  <ChevronDown size={12} />高级 — 手动覆盖（一般不需要）
                </summary>
                <div className="p-3 space-y-3 border-t border-white/10">
                  <div>
                    <div className="label">关注的攻击类别（{genForm.attack_categories.length} 项；留空 = 自动从样本派生）</div>
                    <div className="flex flex-wrap gap-1.5">
                      {ATTACK_CATS.map(c => {
                        const on = genForm.attack_categories.includes(c);
                        return (
                          <button key={c} type="button" onClick={() => setGenForm((f: any) => ({ ...f, attack_categories: on ? f.attack_categories.filter((x: string) => x !== c) : [...f.attack_categories, c] }))}
                            className={`badge ${on ? 'badge-dangerous' : 'badge-low'} cursor-pointer`}>{c}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="label">已知的目标 Agent 工具上下文（可选 · 自由粘贴）</div>
                    <textarea className="input min-h-[80px] font-mono text-xs"
                      value={genForm.known_tool_context}
                      onChange={e => setGenForm({ ...genForm, known_tool_context: e.target.value })}
                      placeholder={`如果你已知目标 Agent 的工具定义/名称，可粘贴此处（OpenAI tools schema、清单、或自由描述均可）。\n留空 = 生成与具体工具无关的行为级防护规则（推荐）。`} />
                    <div className="text-[11px] text-slate-500 mt-1">提示：工具本身并非天然危险，关键是被怎样使用。默认生成的是"行为/路径/输出/越狱"维度的规则，可适配任意工具集。</div>
                  </div>
                </div>
              </details>
            </div>
            <div className="flex justify-end items-center gap-3 mt-5">
              {progress && (
                <div className="flex items-center gap-2 text-xs text-slate-300 mr-auto">
                  <span className="inline-block w-2 h-2 rounded-full bg-neon animate-pulse" />
                  <span className="font-mono">{progress.status}</span>
                  {progress.chars > 0 && <span className="text-slate-500">已接收 {progress.chars.toLocaleString()} 字符</span>}
                  {progress.derived?.categories?.length ? (
                    <span className="text-slate-500">· 派生类别 {progress.derived.categories.length}</span>
                  ) : null}
                </div>
              )}
              <button className="btn-ghost" onClick={() => setGenOpen(false)} disabled={generating}>取消</button>
              <button className="btn" disabled={!genForm.generator_model_id || generating} onClick={generate}>
                <Sparkles size={16} />{generating ? '生成中…' : '生成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
