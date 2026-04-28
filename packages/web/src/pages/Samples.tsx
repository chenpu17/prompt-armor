import { useEffect, useState } from 'react';
import { api, streamGenerate } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import { Sparkles, Trash2, FolderPlus, X, Filter, FileText as FileIcon } from 'lucide-react';
import { useStore } from '../store';

export default function Samples() {
  const sets = useStore(s => s.sampleSets);
  const models = useStore(s => s.models);
  const prompts = useStore(s => s.prompts);
  const refresh = useStore(s => s.refresh);
  const [activeSet, setActiveSet] = useState<string>('');
  const [samples, setSamples] = useState<any[]>([]);
  const [filter, setFilter] = useState<{ category: string; is_attack: string }>({ category: '', is_attack: '' });
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState<any>({
    generator_model_id: '', set_id: '', business_context: '一个接入工具调用的 AI 助手，运行在 Linux 受控环境。',
    categories: [],
    count_per_category: 5, languages: ['zh', 'en'], include_benign: true, benign_count: 5,
    intent: '', source_set_ids: [] as string[], prompt_id: '', target_set_name: '',
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ chars: number; status: string } | null>(null);

  useEffect(() => {
    if (!activeSet && sets.length) setActiveSet(sets[0].id);
  }, [sets]);
  useEffect(() => {
    if (!activeSet) { setSamples([]); return; }
    const q: any = { set_id: activeSet };
    if (filter.category) q.category = filter.category;
    if (filter.is_attack !== '') q.is_attack = filter.is_attack;
    api.listSamples(q).then(setSamples);
  }, [activeSet, filter]);

  async function genGo() {
    setBusy(true);
    setProgress({ chars: 0, status: '连接中…' });
    try {
      const payload: any = { ...genForm, set_id: genForm.set_id || undefined };
      if (!payload.categories?.length) delete payload.categories;
      let setId = '';
      let lastErr = '';
      await streamGenerate('/api/samples/generate-stream', payload, (e: any) => {
        if (e.type === 'start') setProgress({ chars: 0, status: '模型已启动 · ' + e.model });
        else if (e.type === 'token') setProgress({ chars: e.total_chars, status: '接收中' });
        else if (e.type === 'done') { setId = e.set_id; setProgress({ chars: 0, status: `完成 · 生成 ${e.generated} 条` }); }
        else if (e.type === 'error') lastErr = e.message;
      });
      if (lastErr) throw new Error(lastErr);
      await refresh('sampleSets');
      if (setId) setActiveSet(setId);
      setGenOpen(false);
    } catch (e: any) {
      alert('生成失败: ' + e.message);
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(null), 1500);
    }
  }

  const cats = Array.from(new Set(samples.map(s => s.category)));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="攻击样本 / 评测集"
        subtitle="红队样本 + 正常对照样本。支持自由文本描述生成、基于已有样本集扩展、根据系统提示词生成专项评测集"
        actions={
          <>
            <button className="btn-ghost" onClick={async () => {
              const name = prompt('样本集名称'); if (!name) return;
              const r = await api.createSampleSet({ name }); await refresh('sampleSets'); setActiveSet(r.id);
            }}><FolderPlus size={16} />新建样本集</button>
            <button className="btn" onClick={() => setGenOpen(true)}><Sparkles size={16} />AI 生成</button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-2">
          {sets.map(s => (
            <div key={s.id} className={`group rounded-xl border transition ${activeSet === s.id ? 'bg-violet1/15 border-violet1/50 shadow-glow' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              <button className="w-full text-left p-3" onClick={() => setActiveSet(s.id)}>
                <div className="font-medium text-sm flex items-center justify-between">
                  <span className="truncate">{s.name}</span>
                  <span className="text-[11px] text-slate-400">{s.sample_count}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{s.description}</div>
              </button>
              <div className="px-3 pb-2 flex justify-end opacity-0 group-hover:opacity-100 transition">
                <button className="btn-danger !p-1 !text-[10px]" onClick={async () => {
                  if (!confirm(`删除样本集"${s.name}"？所有样本一并删除`)) return;
                  await api.deleteSampleSet(s.id); await refresh('sampleSets');
                  if (activeSet === s.id) setActiveSet('');
                }}><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-12 lg:col-span-9">
          <GlowCard>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Filter size={14} className="text-slate-400" />
              <select className="input !w-auto !py-1.5 text-xs" value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
                <option value="">全部分类</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input !w-auto !py-1.5 text-xs" value={filter.is_attack} onChange={e => setFilter({ ...filter, is_attack: e.target.value })}>
                <option value="">全部</option>
                <option value="1">攻击</option>
                <option value="0">正常</option>
              </select>
              <span className="text-xs text-slate-500 ml-auto">{samples.length} 条</span>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {samples.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-violet1/30 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`badge ${s.is_attack ? 'badge-dangerous' : 'badge-safe'}`}>{s.is_attack ? 'ATTACK' : 'BENIGN'}</span>
                        <span className={`badge badge-${s.severity}`}>{s.severity}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{s.category}/{s.subcategory}</span>
                        <span className="text-[11px] text-slate-600">{s.language}</span>
                        {s.source && <span className="text-[10px] text-slate-600">· {s.source}</span>}
                      </div>
                      <div className="text-sm text-slate-200 break-words whitespace-pre-wrap">{s.payload}</div>
                      {s.expected_behavior && <div className="text-[11px] text-slate-500 mt-1">期望: {s.expected_behavior}</div>}
                    </div>
                    <button className="btn-danger !p-1.5 shrink-0" onClick={async () => { await api.deleteSample(s.id); setSamples(samples.filter(x => x.id !== s.id)); }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {!samples.length && <div className="text-center py-12 text-slate-500 text-sm">该样本集为空</div>}
            </div>
          </GlowCard>
        </div>
      </div>

      {genOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="text-neon" size={20} />AI 生成攻击样本 / 评测集</h2>
              <button className="btn-ghost !p-1.5" onClick={() => setGenOpen(false)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="label">生成模型 (AttackSampleGen)</div>
                <select className="input" value={genForm.generator_model_id} onChange={e => setGenForm({ ...genForm, generator_model_id: e.target.value })}>
                  <option value="">— 请选择 —</option>
                  {models.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <div className="label">用一段话描述你想要的样本（自由文本，可不填）</div>
                <textarea className="input min-h-[60px]" placeholder="例：测试用户假装维护人员要求 chmod、rm 系统目录的样本；或者 prompt injection via 文档摘要..."
                  value={genForm.intent} onChange={e => setGenForm({ ...genForm, intent: e.target.value })} />
              </div>
              <div>
                <div className="label flex items-center gap-2"><FileIcon size={12} />针对某个系统提示词生成评测集（可选 — 选了将忽略"业务背景"，专门探测该提示词的弱点）</div>
                <select className="input" value={genForm.prompt_id} onChange={e => setGenForm({ ...genForm, prompt_id: e.target.value })}>
                  <option value="">不针对任何提示词</option>
                  {prompts.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <div className="label">参考样本集（可选，从中抽取若干样本作为多样性参考）</div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto p-2 bg-black/30 rounded-lg">
                  {sets.map((s: any) => {
                    const on = genForm.source_set_ids.includes(s.id);
                    return <button key={s.id} type="button" className={`badge ${on ? 'badge-dangerous' : 'badge-low'} cursor-pointer`}
                      onClick={() => setGenForm((f: any) => ({ ...f, source_set_ids: on ? f.source_set_ids.filter((x: string) => x !== s.id) : [...f.source_set_ids, s.id] }))}>{s.name}</button>;
                  })}
                </div>
              </div>
              <div>
                <div className="label">写入样本集</div>
                <select className="input" value={genForm.set_id} onChange={e => setGenForm({ ...genForm, set_id: e.target.value })}>
                  <option value="">新建样本集（推荐 — 评测专用）</option>
                  {sets.map((s: any) => <option key={s.id} value={s.id}>{s.name}（追加）</option>)}
                </select>
              </div>
              {!genForm.set_id && (
                <div><div className="label">新样本集名称（可选）</div>
                  <input className="input" value={genForm.target_set_name} onChange={e => setGenForm({ ...genForm, target_set_name: e.target.value })} placeholder="留空将自动命名" /></div>
              )}
              <div><div className="label">业务背景（不针对提示词时使用）</div><textarea className="input min-h-[60px]" value={genForm.business_context} onChange={e => setGenForm({ ...genForm, business_context: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="label">每类条数（默认 5，可留空）</div>
                  <input className="input" type="number" min={1} max={20} placeholder="5" value={genForm.count_per_category ?? ''} onChange={e => setGenForm({ ...genForm, count_per_category: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </div>
                <div>
                  <div className="label">benign 条数（默认 5，可留空）</div>
                  <input className="input" type="number" min={0} max={20} placeholder="5" value={genForm.benign_count ?? ''} onChange={e => setGenForm({ ...genForm, benign_count: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center gap-3 mt-5">
              {progress && (
                <div className="flex items-center gap-2 text-xs text-slate-300 mr-auto">
                  <span className="inline-block w-2 h-2 rounded-full bg-neon animate-pulse" />
                  <span className="font-mono">{progress.status}</span>
                  {progress.chars > 0 && <span className="text-slate-500">已接收 {progress.chars.toLocaleString()} 字符</span>}
                </div>
              )}
              <button className="btn-ghost" onClick={() => setGenOpen(false)} disabled={busy}>取消</button>
              <button className="btn" disabled={!genForm.generator_model_id || busy} onClick={genGo}>{busy ? '生成中…' : '生成'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
