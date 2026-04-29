import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import RadarChart from '../components/RadarChart';
import { Wand2, ChevronRight, X } from 'lucide-react';

export default function EvalReport() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id } = useParams();
  const [list, setList] = useState<any[]>([]);
  const [evalRow, setEvalRow] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [optOpen, setOptOpen] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [optForm, setOptForm] = useState<any>({ generator_model_id: '', extra_requirements: '', title: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.listEvaluations().then(setList); api.listModels().then(setModels); }, []);
  useEffect(() => {
    if (!id) return;
    api.getEvaluation(id).then(setEvalRow);
    api.getEvaluationResults(id).then(setResults);
  }, [id]);

  if (!id) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
        <div className="space-y-2">
          {list.map(e => (
            <Link to={`/reports/${e.id}`} key={e.id} className="block">
              <GlowCard>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${e.status === 'done' ? 'bg-neon' : e.status === 'running' ? 'bg-amber-400 pulse-dot' : e.status === 'failed' ? 'bg-magenta' : 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{e.prompt_title} · {e.sample_set_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{e.id} · {new Date(e.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                  {e.metrics_json && (
                    <ScoreBadge metrics={JSON.parse(e.metrics_json)} />
                  )}
                  <ChevronRight className="text-slate-500" size={16} />
                </div>
              </GlowCard>
            </Link>
          ))}
          {!list.length && <div className="text-center py-16 text-slate-500">{t('reports.empty')}</div>}
        </div>
      </div>
    );
  }

  const metrics = evalRow?.metrics_json ? JSON.parse(evalRow.metrics_json) : null;
  const radar = metrics?.per_category
    ? Object.entries(metrics.per_category).map(([k, v]: any) => ({ category: k, value: Math.round((v.passed / Math.max(v.total, 1)) * 100) }))
    : [];
  const failed = results.filter(r => r.passed === 0);

  async function optimize() {
    setBusy(true);
    try {
      const r = await api.optimizePrompt(evalRow.prompt_id, {
        generator_model_id: optForm.generator_model_id,
        evaluation_id: evalRow.id,
        extra_requirements: optForm.extra_requirements,
        title: optForm.title || undefined,
      });
      setOptOpen(false);
      nav('/prompts');
    } catch (e: any) { alert(t('reports.optFailed') + e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title={t('reports.title')}
        subtitle={evalRow ? `${evalRow.id}` : t('reports.loading')}
        actions={
          <>
            <Link to="/reports" className="btn-ghost">{t('reports.backToList')}</Link>
            <button className="btn" onClick={() => setOptOpen(true)} disabled={!failed.length}>
              <Wand2 size={16} />{t('reports.optimizeBtn', { count: failed.length })}
            </button>
          </>
        }
      />

      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <GlowCard className="lg:col-span-2">
            <div className="text-sm text-slate-400 mb-3">{t('reports.radarTitle')}</div>
            <RadarChart data={radar} />
          </GlowCard>
          <GlowCard>
            <div className="text-sm text-slate-400 mb-3">{t('reports.statsTitle')}</div>
            <div className="space-y-3">
              <Stat label={t('reports.statTotal')} v={metrics.total} />
              <Stat label={t('reports.statAttack')} v={pct(metrics.attack_pass_rate)} good />
              <Stat label={t('reports.statBenign')} v={pct(metrics.benign_pass_rate)} good />
              <Stat label={t('reports.statForbidden')} v={pct(metrics.forbidden_tool_trigger_rate)} bad />
              <Stat label={t('reports.statLeak')} v={pct(metrics.info_leak_rate)} bad />
              <Stat label={t('reports.statJudge')} v={(metrics.avg_judge_score || 0).toFixed(2) + ' / 10'} />
            </div>
          </GlowCard>
        </div>
      )}

      <GlowCard>
        <div className="text-sm text-slate-400 mb-3">{failed.length ? t('reports.failCases', { failed: failed.length, total: results.length }) : t('reports.allCases', { total: results.length })}</div>
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {(failed.length ? failed : results).map(r => (
            <div key={r.id} className={`p-3 rounded-xl bg-black/30 border ${r.passed ? 'border-emerald-500/20' : 'border-magenta/30'}`}>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`badge ${r.passed ? 'badge-safe' : 'badge-dangerous'}`}>{r.passed ? t('reports.passed') : t('reports.notPassed')}</span>
                <span className={`badge ${r.is_attack ? 'badge-dangerous' : 'badge-safe'}`}>{r.is_attack ? 'ATTACK' : 'BENIGN'}</span>
                <span className="text-[11px] font-mono text-slate-500">{r.category}</span>
                <span className="text-[11px] text-slate-500">{t('reports.scoreLabel')}{(r.judge_score ?? 0).toFixed(1)}</span>
              </div>
              <div className="text-xs"><span className="text-slate-500">U:</span> {r.payload}</div>
              <div className="text-xs text-slate-400 mt-1 whitespace-pre-wrap"><span className="text-slate-500">M:</span> {(r.target_response || '').slice(0, 400)}</div>
              {r.tool_calls_json && JSON.parse(r.tool_calls_json).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {JSON.parse(r.tool_calls_json).map((tc: any, i: number) => <span key={i} className="badge badge-dangerous font-mono text-[10px]">⚙ {tc.function?.name}</span>)}
                </div>
              )}
              {r.judge_reason && <div className="text-[11px] text-slate-500 mt-1">JUDGE: {r.judge_reason}</div>}
            </div>
          ))}
        </div>
      </GlowCard>

      {optOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
          <div className="glass p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Wand2 className="text-neon" size={20} />{t('reports.optTitle')}</h2>
              <button className="btn-ghost !p-1.5" onClick={() => setOptOpen(false)}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="label">{t('reports.optModel')}</div>
                <select className="input" value={optForm.generator_model_id} onChange={e => setOptForm({ ...optForm, generator_model_id: e.target.value })}>
                  <option value="">{t('eval.pleaseSelect')}</option>
                  {models.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div><div className="label">{t('reports.optNewTitle')}</div><input className="input" value={optForm.title} onChange={e => setOptForm({ ...optForm, title: e.target.value })} /></div>
              <div><div className="label">{t('reports.optExtra')}</div><textarea className="input min-h-[60px]" value={optForm.extra_requirements} onChange={e => setOptForm({ ...optForm, extra_requirements: e.target.value })} /></div>
              <div className="text-xs text-slate-400 bg-violet1/10 border border-violet1/30 rounded-lg p-3"
                dangerouslySetInnerHTML={{ __html: t('reports.failInfo', { count: failed.length }) }}
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={() => setOptOpen(false)}>{t('reports.optCancel')}</button>
              <button className="btn" disabled={!optForm.generator_model_id || busy} onClick={optimize}>{busy ? t('reports.optBusy') : t('reports.optSubmit')}</button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, v, good, bad }: any) {
  return <div className="flex justify-between"><span className="text-slate-400 text-sm">{label}</span><span className={`font-mono font-semibold ${good ? 'text-neon' : bad ? 'text-magenta' : ''}`}>{v}</span></div>;
}
function pct(v: number) { return ((v || 0) * 100).toFixed(1) + '%'; }
function ScoreBadge({ metrics }: any) {
  const { t } = useTranslation();
  const ap = (metrics.attack_pass_rate || 0) * 100;
  const bp = (metrics.benign_pass_rate || 0) * 100;
  return (
    <div className="flex gap-2 text-[11px] font-mono">
      <span className="badge badge-dangerous">{t('reports.badgeAttack', { pct: ap.toFixed(0) })}</span>
      <span className="badge badge-safe">{t('reports.badgeBenign', { pct: bp.toFixed(0) })}</span>
    </div>
  );
}
