import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, streamEvaluation } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Shield, Skull, CheckCircle2, XCircle } from 'lucide-react';

export default function EvalRun() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id: paramId } = useParams();
  const [models, setModels] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ prompt_id: '', sample_set_id: '', target_model_id: '', judge_model_id: '', concurrency: 4, profile_id: '' });
  const [evalId, setEvalId] = useState<string | null>(paramId || null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [items, setItems] = useState<any[]>([]);
  const [done, setDone] = useState(false);
  const closeRef = useRef<() => void>();

  useEffect(() => {
    api.listModels().then(setModels);
    api.listPrompts().then(setPrompts);
    api.listSampleSets().then(setSets);
    api.listToolProfiles().then(setProfiles);
  }, []);

  useEffect(() => {
    if (!evalId) return;
    setItems([]); setProgress({ completed: 0, total: 0 }); setDone(false);
    closeRef.current?.();
    closeRef.current = streamEvaluation(evalId, (event, data) => {
      if (event === 'start') setProgress({ completed: 0, total: data.total });
      if (event === 'progress') {
        setProgress({ completed: data.completed, total: data.total });
        setItems(prev => [data.item, ...prev].slice(0, 200));
      }
      if (event === 'done') setDone(true);
    });
    return () => closeRef.current?.();
  }, [evalId]);

  async function start() {
    const r = await api.startEvaluation(form);
    setEvalId(r.id);
    nav(`/eval/${r.id}`);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title={t('eval.title')} subtitle={t('eval.subtitle')} />

      {!evalId && (
        <GlowCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Selector label={t('eval.labelPrompt')} value={form.prompt_id} options={prompts.map((p: any) => ({ value: p.id, label: p.title }))} onChange={(v: string) => setForm({ ...form, prompt_id: v })} />
            <Selector label={t('eval.labelSampleSet')} value={form.sample_set_id} options={sets.map((s: any) => ({ value: s.id, label: `${s.name}（${s.sample_count}）` }))} onChange={(v: string) => setForm({ ...form, sample_set_id: v })} />
            <Selector label={t('eval.labelTarget')} value={form.target_model_id} options={models.map((m: any) => ({ value: m.id, label: m.name }))} onChange={(v: string) => setForm({ ...form, target_model_id: v })} />
            <Selector label={t('eval.labelJudge')} value={form.judge_model_id} options={models.map((m: any) => ({ value: m.id, label: m.name }))} onChange={(v: string) => setForm({ ...form, judge_model_id: v })} />
            <div>
              <div className="label">{t('eval.labelProfile')}</div>
              <select className="input" value={form.profile_id} onChange={e => setForm({ ...form, profile_id: e.target.value })}>
                <option value="">{t('eval.profileAll')}</option>
                {profiles.map((p: any) => {
                  const names = JSON.parse(p.tool_names || '[]');
                  return <option key={p.id} value={p.id}>{p.name}（{names.length} {t('eval.tools')}）</option>;
                })}
              </select>
              {form.profile_id && profiles.find((p: any) => p.id === form.profile_id)?.description && (
                <div className="text-[11px] text-slate-500 mt-1">{profiles.find((p: any) => p.id === form.profile_id).description}</div>
              )}
            </div>
            <div>
              <div className="label">{t('eval.labelConcurrency')}</div>
              <input className="input" type="number" min={1} max={16} value={form.concurrency} onChange={e => setForm({ ...form, concurrency: Number(e.target.value) })} />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button className="btn" disabled={!form.prompt_id || !form.sample_set_id || !form.target_model_id || !form.judge_model_id} onClick={start}>
              <Play size={16} />{t('eval.startBtn')}
            </button>
          </div>
        </GlowCard>
      )}

      {evalId && (
        <>
          <GlowCard className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-slate-400">{t('eval.evalId')}</div>
                <div className="font-mono text-sm">{evalId}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">{t('eval.progress')}</div>
                <div className="font-mono text-2xl">{progress.completed} / {progress.total}</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet1 via-magenta to-neon"
                animate={{ width: progress.total ? `${(progress.completed / progress.total) * 100}%` : '0%' }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            {done && (
              <div className="mt-4 flex items-center gap-2 text-neon">
                <CheckCircle2 size={18} />
                {t('eval.done')}
                <button className="btn ml-auto" onClick={() => nav(`/reports/${evalId}`)}>{t('eval.viewReport')}</button>
              </div>
            )}
          </GlowCard>

          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            <AnimatePresence initial={false}>
              {items.map((it: any, idx) => (
                <motion.div
                  key={(it.sample_id || '') + idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`glass p-4 ${it.passed ? 'border-l-4 border-l-neon' : 'border-l-4 border-l-magenta'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${it.is_attack ? 'bg-magenta/20 text-magenta' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {it.is_attack ? <Skull size={18} /> : <Shield size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-mono text-slate-400">{it.category}</span>
                        <span className={`badge ${it.passed ? 'badge-safe' : 'badge-dangerous'}`}>
                          {it.passed ? <><CheckCircle2 size={12} />{t('eval.passLabel')}</> : <><XCircle size={12} />{t('eval.failLabel')}</>}
                        </span>
                        <span className="text-[11px] text-slate-500">{t('eval.scoreLabel')}{(it.score ?? 0).toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-slate-300 mb-2 break-words"><span className="text-slate-500">USER ▸</span> {it.payload}</div>
                      <div className="text-xs text-slate-400 break-words whitespace-pre-wrap">
                        <span className="text-slate-500">MODEL ▸</span> {(it.target_response || '').slice(0, 400) || (it.error ? <span className="text-red-400">{t('eval.errorLabel')}{it.error}</span> : t('eval.emptyResponse'))}
                      </div>
                      {it.tool_calls && it.tool_calls.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {it.tool_calls.map((tc: any, i: number) => (
                            <span key={i} className="badge badge-dangerous font-mono">⚙ {tc.function?.name}</span>
                          ))}
                        </div>
                      )}
                      {it.reason && <div className="text-[11px] text-slate-500 mt-1.5">JUDGE: {it.reason}</div>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

function Selector({ label, value, options, onChange }: any) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="label">{label}</div>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{t('eval.pleaseSelect')}</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
