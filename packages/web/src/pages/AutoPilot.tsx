import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, streamAutoRun } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Sparkles, Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Trophy, Activity, Wand2, FlaskConical, GitBranch, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RunRow {
  id: string;
  name: string;
  status: string;
  current_iteration: number;
  max_iterations: number;
  best_score: number | null;
  best_prompt_id: string | null;
  best_prompt_title: string | null;
  iter_count: number;
  created_at: number;
  error_message?: string | null;
}

function getPhaseLabel(t: (k: string) => string): Record<string, string> {
  return {
    seed_prompt: t('auto.phaseLabel_seed_prompt'),
    seed_samples: t('auto.phaseLabel_seed_samples'),
    eval: t('auto.phaseLabel_eval'),
    optimize: t('auto.phaseLabel_optimize'),
    refresh_samples: t('auto.phaseLabel_refresh_samples'),
    converged: t('auto.phaseLabel_converged'),
    plateau: t('auto.phaseLabel_plateau'),
  };
}

const PHASE_ICON: Record<string, any> = {
  seed_prompt: Wand2, seed_samples: FlaskConical, eval: Activity,
  optimize: Wand2, refresh_samples: FlaskConical, converged: Trophy, plateau: Trophy,
};

export default function AutoPilot() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id: paramId } = useParams();
  const [models, setModels] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(paramId || null);

  // form
  const [form, setForm] = useState<any>({
    name: '',
    intent: '',
    business_context: '',
    seed_text: '',
    generator_model_id: '',
    attacker_model_id: '',
    target_model_id: '',
    judge_model_id: '',
    max_iterations: 3,
    pass_threshold: 0.95,
    refresh_ratio: 0.3,
    initial_set_size: 24,
    profile_id: '',
  });

  async function reloadRuns() {
    const list = await api.listAutoRuns().catch(() => []);
    setRuns(list);
  }

  useEffect(() => {
    api.listModels().then((m: any[]) => {
      setModels(m);
      if (m.length) {
        setForm((f: any) => ({
          ...f,
          generator_model_id: f.generator_model_id || m[0].id,
          attacker_model_id: f.attacker_model_id || m[0].id,
          target_model_id: f.target_model_id || m[0].id,
          judge_model_id: f.judge_model_id || m[0].id,
        }));
      }
    });
    api.listToolProfiles().then(setProfiles);
    reloadRuns();
  }, []);

  useEffect(() => { setActiveId(paramId || null); }, [paramId]);

  async function start() {
    if (!form.name.trim()) return alert(t('auto.alertName'));
    const seed_samples = parseSeedSamples(form.seed_text);
    if (!seed_samples.length) return alert(t('auto.alertSeeds'));
    const body = {
      name: form.name.trim(),
      intent: form.intent.trim(),
      business_context: form.business_context.trim() || t('auto.bizCtxDefault'),
      seed_samples,
      generator_model_id: form.generator_model_id,
      attacker_model_id: form.attacker_model_id,
      target_model_id: form.target_model_id,
      judge_model_id: form.judge_model_id,
      max_iterations: Number(form.max_iterations) || 3,
      pass_threshold: Number(form.pass_threshold) || 0.95,
      refresh_ratio: Number(form.refresh_ratio) || 0.3,
      initial_set_size: Number(form.initial_set_size) || 24,
      profile_id: form.profile_id || undefined,
    };
    try {
      const r = await api.startAutoRun(body);
      reloadRuns();
      nav(`/auto/${r.id}`);
    } catch (e: any) {
      alert(t('auto.startFailed') + (e?.message || e));
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={t('autopilot.title')}
        subtitle={t('autopilot.subtitle')}
      />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <GlowCard className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-300">{t('auto.historyTitle')}</div>
              <button className="text-xs text-violet1 hover:underline" onClick={() => { setActiveId(null); nav('/auto'); }}>{t('auto.newRun')}</button>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
              {runs.length === 0 && <div className="text-xs text-slate-500">{t('auto.noRuns')}</div>}
              {runs.map(r => (
                <button key={r.id}
                  onClick={() => { setActiveId(r.id); nav(`/auto/${r.id}`); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${activeId === r.id
                    ? 'bg-violet1/15 border-violet1/50 shadow-glow'
                    : 'border-white/5 hover:border-white/15 hover:bg-white/5'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>{t('auto.itersOf', { current: r.iter_count, max: r.max_iterations })}</span>
                    {r.best_score != null && <span>{t('auto.bestOf', { pct: (r.best_score * 100).toFixed(1) })}</span>}
                  </div>
                </button>
              ))}
            </div>
          </GlowCard>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          {!activeId ? (
            <NewRunForm models={models} profiles={profiles} form={form} setForm={setForm} onStart={start} />
          ) : (
            <RunDetail runId={activeId} onChanged={reloadRuns} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, { c: string; label: string }> = {
    pending: { c: 'bg-slate-600/40 text-slate-300', label: t('auto.statusPending') },
    running: { c: 'bg-violet1/30 text-violet-200 animate-pulse', label: t('auto.statusRunning') },
    done: { c: 'bg-emerald-500/20 text-emerald-300', label: t('auto.statusDone') },
    failed: { c: 'bg-rose-500/20 text-rose-300', label: t('auto.statusFailed') },
    stopped: { c: 'bg-amber-500/20 text-amber-300', label: t('auto.statusStopped') },
  };
  const v = map[status] || map.pending;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.c}`}>{v.label}</span>;
}

function NewRunForm({ models, profiles, form, setForm, onStart }: any) {
  const { t } = useTranslation();
  const ROLES: { key: string; label: string; hint: string }[] = [
    { key: 'generator_model_id', label: t('auto.roleGenerator'), hint: t('auto.roleGeneratorHint') },
    { key: 'attacker_model_id', label: t('auto.roleAttacker'), hint: t('auto.roleAttackerHint') },
    { key: 'target_model_id', label: t('auto.roleTarget'), hint: t('auto.roleTargetHint') },
    { key: 'judge_model_id', label: t('auto.roleJudge'), hint: t('auto.roleJudgeHint') },
  ];
  return (
    <GlowCard>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-violet1" size={20} />
        <div className="text-lg font-semibold">{t('auto.configTitle')}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t('auto.fieldName')} required>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder={t('auto.fieldNamePlaceholder')} />
        </Field>
        <Field label={t('auto.fieldIters')} hint={t('auto.fieldItersHint')}>
          <input type="number" min={1} max={20} className="input"
            value={form.max_iterations}
            onChange={e => setForm({ ...form, max_iterations: e.target.value })} />
        </Field>
        <Field label={t('auto.fieldBizCtx')} className="md:col-span-2"
          hint={t('auto.fieldBizCtxHint')}>
          <textarea rows={2} className="input"
            value={form.business_context}
            onChange={e => setForm({ ...form, business_context: e.target.value })}
            placeholder={t('auto.fieldBizCtxPlaceholder')} />
        </Field>
        <Field label={t('auto.fieldIntent')} className="md:col-span-2">
          <input className="input"
            value={form.intent}
            onChange={e => setForm({ ...form, intent: e.target.value })}
            placeholder={t('auto.fieldIntentPlaceholder')} />
        </Field>
        <Field label={t('auto.fieldSeeds')} className="md:col-span-2" required
          hint={t('auto.fieldSeedsHint')}>
          <textarea rows={6} className="input font-mono text-xs"
            value={form.seed_text}
            onChange={e => setForm({ ...form, seed_text: e.target.value })}
            placeholder={t('auto.fieldSeedsPlaceholder')} />
        </Field>

        {ROLES.map(r => (
          <Field key={r.key} label={r.label} hint={r.hint}>
            <select className="input" value={form[r.key]} onChange={e => setForm({ ...form, [r.key]: e.target.value })}>
              <option value="">{t('auto.selectModel')}</option>
              {models.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
        ))}
        <Field label={t('auto.fieldThreshold')} hint={t('auto.fieldThresholdHint')}>
          <input type="number" step={0.01} min={0} max={1} className="input"
            value={form.pass_threshold}
            onChange={e => setForm({ ...form, pass_threshold: e.target.value })} />
        </Field>
        <Field label={t('auto.fieldRefreshRatio')} hint={t('auto.fieldRefreshRatioHint')}>
          <input type="number" step={0.05} min={0} max={1} className="input"
            value={form.refresh_ratio}
            onChange={e => setForm({ ...form, refresh_ratio: e.target.value })} />
        </Field>
        <Field label={t('auto.fieldInitSetSize')} hint={t('auto.fieldInitSetSizeHint')}>
          <input type="number" min={6} max={80} className="input"
            value={form.initial_set_size}
            onChange={e => setForm({ ...form, initial_set_size: e.target.value })} />
        </Field>
        <Field label={t('auto.fieldProfile')} hint={t('auto.fieldProfileHint')}>
          <select className="input" value={form.profile_id} onChange={e => setForm({ ...form, profile_id: e.target.value })}>
            <option value="">{t('auto.profileAll')}</option>
            {profiles.map((p: any) => {
              const names = JSON.parse(p.tool_names || '[]');
              return <option key={p.id} value={p.id}>{p.name}（{names.length} {t('eval.tools')}）</option>;
            })}
          </select>
          {form.profile_id && profiles.find((p: any) => p.id === form.profile_id)?.description && (
            <div className="text-[11px] text-slate-500 mt-1">{profiles.find((p: any) => p.id === form.profile_id).description}</div>
          )}
        </Field>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onStart}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet1 to-magenta text-white font-semibold flex items-center gap-2 shadow-glow hover:opacity-90">
          <Rocket size={18} /> {t('auto.startBtn')}
        </button>
      </div>
    </GlowCard>
  );
}

function Field({ label, children, required, hint, className = '' }: any) {
  return (
    <div className={className}>
      <div className="text-xs text-slate-400 mb-1 flex items-center gap-2">
        <span>{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</span>
        {hint && <span className="text-[10px] text-slate-600">— {hint}</span>}
      </div>
      {children}
    </div>
  );
}

function parseSeedSamples(text: string) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => ({ payload: l, is_attack: true }));
}

function RunDetail({ runId, onChanged }: { runId: string; onChanged: () => void }) {
  const { t } = useTranslation();
  const PHASE_LABEL = getPhaseLabel(t);
  const nav = useNavigate();
  const [run, setRun] = useState<any>(null);
  const [iters, setIters] = useState<any[]>([]);
  const [phase, setPhase] = useState<{ name: string; iter?: number; tokens?: number; evalTotal?: number; evalCompleted?: number } | null>(null);
  const [logs, setLogs] = useState<{ ts: number; type: string; text: string }[]>([]);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const closeRef = useRef<() => void>();

  async function reload() {
    const r = await api.getAutoRun(runId);
    setRun(r);
    setIters(r.iterations || []);
    const sh: number[] = [];
    for (const it of (r.iterations || [])) {
      if (it.metrics_json) {
        try {
          const m = JSON.parse(it.metrics_json);
          sh.push((m.attack_pass_rate || 0) * 0.7 + (m.benign_pass_rate || 0) * 0.3);
        } catch {}
      }
    }
    setScoreHistory(sh);
    if (r.status === 'done' || r.status === 'failed' || r.status === 'stopped') setDone(true);
  }

  useEffect(() => {
    setLogs([]); setPhase(null); setDone(false);
    reload();
    closeRef.current?.();
    closeRef.current = streamAutoRun(runId, (event, data) => {
      if (event === 'init') setRun(data);
      if (event === 'start') addLog('info', t('auto.logStart', { name: data.name, maxIter: data.max_iterations }));
      if (event === 'phase') {
        setPhase({ name: data.phase, iter: data.iter_no });
        addLog('phase', `${data.iter_no ? t('auto.logPhaseRound', { no: data.iter_no }) : ''}${PHASE_LABEL[data.phase] || data.phase}${data.message ? t('auto.logPhaseSep') + data.message : ''}`);
      }
      if (event === 'token') setPhase(p => ({ ...(p || { name: data.phase }), iter: data.iter_no, tokens: data.total }));
      if (event === 'eval_progress') {
        setPhase(p => ({
          name: 'eval',
          iter: data.iter_no,
          evalTotal: data.total,
          evalCompleted: data.completed ?? p?.evalCompleted ?? 0,
        }));
      }
      if (event === 'eval_finish') {
        setPhase(p => ({ ...(p || { name: 'eval' }), iter: data.iter_no, evalCompleted: p?.evalTotal }));
      }
      if (event === 'iter_start') {
        addLog('info', t('auto.logIterStart', { no: data.iter_no }));
      }
      if (event === 'iter_done') {
        addLog('ok', t('auto.logIterDone', { no: data.iter_no, score: (data.score * 100).toFixed(1), attack: (data.metrics.attack_pass_rate * 100).toFixed(1), benign: (data.metrics.benign_pass_rate * 100).toFixed(1) }));
        setScoreHistory(prev => [...prev, data.score]);
        reload();
      }
      if (event === 'warn') addLog('warn', String(data.message || JSON.stringify(data)));
      if (event === 'stopped') { addLog('warn', t('auto.logStopped', { no: data.iter_no })); setDone(true); reload(); onChanged(); }
      if (event === 'done') {
        addLog('done', t('auto.logDone', { best: (data.best_score * 100).toFixed(1), iters: data.iterations }));
        setDone(true); reload(); onChanged();
      }
      if (event === 'error') { addLog('err', String(data.message || data)); setDone(true); reload(); onChanged(); }
    });
    return () => closeRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  function addLog(type: string, text: string) {
    setLogs(prev => [...prev, { ts: Date.now(), type, text }].slice(-200));
  }

  async function stop() {
    if (!confirm(t('auto.stopConfirm'))) return;
    await api.stopAutoRun(runId);
  }

  if (!run) return <GlowCard><div className="text-slate-400">{t('auto.loading')}</div></GlowCard>;

  const bestPct = run.best_score != null ? (run.best_score * 100).toFixed(1) : '-';
  const progressPct = run.max_iterations ? Math.min(100, Math.round(((run.current_iteration || 0) / run.max_iterations) * 100)) : 0;

  return (
    <>
      {/* 头部状态卡 */}
      <GlowCard>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">{run.name}</div>
              <StatusPill status={run.status} />
            </div>
            <div className="text-xs text-slate-500 mt-1">{new Date(run.created_at).toLocaleString('zh-CN')}</div>
          </div>
          <div className="flex gap-2">
            {run.status === 'running' && (
              <button onClick={stop} className="btn-ghost text-amber-300 flex items-center gap-1">
                <Square size={14} /> {t('auto.stopBtn')}
              </button>
            )}
            {run.best_prompt_id && (
              <button onClick={() => nav(`/prompts`)} className="btn-ghost text-emerald-300 flex items-center gap-1">
                <Trophy size={14} /> {t('auto.viewBestPrompt')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <Stat label={t('auto.statProgress')} value={`${run.current_iteration || 0} / ${run.max_iterations}`} />
          <Stat label={t('auto.statBest')} value={bestPct === '-' ? '-' : `${bestPct}%`} accent="emerald" />
          <Stat label={t('auto.statThreshold')} value={`${(run.pass_threshold * 100).toFixed(0)}%`} />
          <Stat label={t('auto.statStatus')} value={statusText(run.status, t)} />
        </div>

        {run.status === 'failed' && run.error_message && (
          <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-xs text-rose-300 flex gap-2 items-start">
            <XCircle size={14} className="shrink-0 mt-0.5" />
            <div><span className="font-semibold mr-1">{t('auto.errorDetail')}:</span>{run.error_message}</div>
          </div>
        )}

        <div className="mt-4">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet1 to-magenta"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <AnimatePresence mode="wait">
            {phase && !done && (
              <motion.div
                key={phase.name + (phase.iter || '')}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-slate-400 mt-2 flex items-center gap-2"
              >
                <Loader2 size={12} className="animate-spin text-violet1" />
                <span>{phase.iter ? t('auto.phaseRound', { no: phase.iter }) : ''}{PHASE_LABEL[phase.name] || phase.name}</span>
                {phase.tokens != null && <span className="text-violet-300">· {phase.tokens.toLocaleString()} tokens</span>}
                {phase.evalTotal != null && (
                  <span className="text-cyan-300 flex items-center gap-2">
                    {t('auto.evalProgress', { completed: phase.evalCompleted ?? 0, total: phase.evalTotal })}
                    <span className="inline-block w-24 h-1.5 rounded-full bg-slate-700/60 overflow-hidden align-middle">
                      <span
                        className="block h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, ((phase.evalCompleted ?? 0) / Math.max(1, phase.evalTotal)) * 100)}%` }}
                      />
                    </span>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlowCard>

      {/* 分数曲线 */}
      {scoreHistory.length > 0 && (
        <GlowCard>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="text-neon" size={16} />
            <div className="font-semibold">{t('auto.scoreTitle')}</div>
            <span className="text-xs text-slate-500">{t('auto.scoreFormula')}</span>
          </div>
          <ScoreChart values={scoreHistory} />
        </GlowCard>
      )}

      {/* 轮次时间线 */}
      <GlowCard>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="text-violet1" size={16} />
          <div className="font-semibold">{t('auto.timelineTitle')}</div>
        </div>
        {iters.length === 0 && <div className="text-xs text-slate-500">{t('auto.timelineEmpty')}</div>}
        <div className="space-y-3">
          {iters.map(it => <IterCard key={it.id} iter={it} onOpen={(eid) => nav(`/reports/${eid}`)} />)}
        </div>
      </GlowCard>

      {/* 日志 */}
      <GlowCard>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="text-slate-400" size={16} />
          <div className="font-semibold text-sm">{t('auto.logTitle')}</div>
        </div>
        <div className="font-mono text-[11px] bg-black/30 rounded-lg p-3 max-h-72 overflow-auto">
          {logs.length === 0 && <div className="text-slate-600">{t('auto.logWaiting')}</div>}
          {logs.map((l, i) => (
            <div key={i} className={
              l.type === 'err' ? 'text-rose-300' :
              l.type === 'warn' ? 'text-amber-300' :
              l.type === 'ok' ? 'text-emerald-300' :
              l.type === 'done' ? 'text-violet-300 font-semibold' :
              l.type === 'phase' ? 'text-cyan-300' :
              'text-slate-300'
            }>
              <span className="text-slate-600">[{new Date(l.ts).toLocaleTimeString('zh-CN')}]</span> {l.text}
            </div>
          ))}
        </div>
      </GlowCard>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${accent === 'emerald' ? 'text-emerald-300' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function statusText(s: string, t: (k: string) => string) {
  return ({
    pending: t('auto.statusText_pending'),
    running: t('auto.statusText_running'),
    done: t('auto.statusText_done'),
    failed: t('auto.statusText_failed'),
    stopped: t('auto.statusText_stopped'),
  } as any)[s] || s;
}

function ScoreChart({ values }: { values: number[] }) {
  const { t } = useTranslation();
  const w = 600, h = 120, pad = 24;
  const points = useMemo(() => {
    if (values.length === 0) return '';
    const xs = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1);
    const ys = (v: number) => h - pad - v * (h - 2 * pad);
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i)},${ys(v)}`).join(' ');
  }, [values]);
  const last = values[values.length - 1] ?? 0;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(255,255,255,.08)" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(255,255,255,.08)" />
        <path d={points} fill="none" stroke="url(#grad)" strokeWidth={2.5} />
        {values.map((v, i) => {
          const x = pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1);
          const y = h - pad - v * (h - 2 * pad);
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#fff" stroke="#8b5cf6" strokeWidth={2} />;
        })}
      </svg>
      <div className="absolute top-2 right-3 text-xs text-slate-400">
        {t('auto.currentLabel')} <span className="text-emerald-300 font-semibold">{(last * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

function IterCard({ iter, onOpen }: { iter: any; onOpen: (eid: string) => void }) {
  const { t } = useTranslation();
  const m = iter.metrics_json ? safeJSON(iter.metrics_json) : null;
  const score = m ? (m.attack_pass_rate || 0) * 0.7 + (m.benign_pass_rate || 0) * 0.3 : null;
  const StatusIcon = iter.status === 'done' ? CheckCircle2 : iter.status === 'running' ? Loader2 : iter.status === 'failed' ? XCircle : AlertTriangle;
  const statusColor = iter.status === 'done' ? 'text-emerald-300' : iter.status === 'running' ? 'text-violet-300 animate-spin' : 'text-amber-300';
  return (
    <div className="rounded-xl border border-white/5 hover:border-violet1/30 p-3 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet1/15 text-violet-200 font-bold flex items-center justify-center text-sm">{iter.iter_no}</div>
          <div>
            <div className="text-sm font-medium flex items-center gap-2">
              {iter.prompt_title || t('auto.promptFallback') + (iter.prompt_id?.slice(-4) || '')}
              <StatusIcon size={14} className={statusColor} />
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{iter.sample_set_name || '-'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {m && (
            <div className="hidden md:flex items-center gap-3 text-[11px]">
              <Metric label={t('auto.metricAttack')} v={m.attack_pass_rate} />
              <Metric label={t('auto.metricBenign')} v={m.benign_pass_rate} />
              <Metric label={t('auto.metricComposite')} v={score} accent />
            </div>
          )}
          {iter.evaluation_id && (
            <button onClick={() => onOpen(iter.evaluation_id)}
              className="text-xs text-violet1 hover:text-magenta flex items-center gap-1">
              {t('auto.detailBtn')} <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, v, accent }: { label: string; v: number | null | undefined; accent?: boolean }) {
  if (v == null) return null;
  return (
    <div className="text-center">
      <div className="text-[9px] text-slate-500">{label}</div>
      <div className={`font-semibold ${accent ? 'text-emerald-300' : 'text-slate-200'}`}>{(v * 100).toFixed(1)}%</div>
    </div>
  );
}

function safeJSON(s: string) { try { return JSON.parse(s); } catch { return null; } }
