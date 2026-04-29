import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import RadarChart from '../components/RadarChart';
import { Activity, Shield, Cpu, Target as TargetIcon, FileText, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>({ models: 0, prompts: 0, samples: 0, evals: 0, lastEval: null });

  useEffect(() => {
    (async () => {
      const [models, prompts, sets, evals] = await Promise.all([
        api.listModels(), api.listPrompts(), api.listSampleSets(), api.listEvaluations(),
      ]);
      const sampleTotal = sets.reduce((a: number, s: any) => a + (s.sample_count || 0), 0);
      const lastDone = evals.find((e: any) => e.status === 'done' && e.metrics_json);
      setStats({
        models: models.length,
        prompts: prompts.length,
        samples: sampleTotal,
        evals: evals.length,
        lastEval: lastDone ? { ...lastDone, metrics: JSON.parse(lastDone.metrics_json) } : null,
      });
    })();
  }, []);

  const cards = [
    { icon: Cpu, label: t('dashboard.cardModels'), val: stats.models, hint: t('dashboard.cardModelsHint'), accent: 'rgba(124,77,255,0.45)', to: '/models' },
    { icon: FileText, label: t('dashboard.cardPrompts'), val: stats.prompts, hint: t('dashboard.cardPromptsHint'), accent: 'rgba(236,72,153,0.45)', to: '/prompts' },
    { icon: TargetIcon, label: t('dashboard.cardSamples'), val: stats.samples, hint: t('dashboard.cardSamplesHint'), accent: 'rgba(6,255,165,0.45)', to: '/samples' },
    { icon: Activity, label: t('dashboard.cardEvals'), val: stats.evals, hint: t('dashboard.cardEvalsHint'), accent: 'rgba(124,77,255,0.45)', to: '/reports' },
  ];

  const radar = stats.lastEval?.metrics?.per_category
    ? Object.entries(stats.lastEval.metrics.per_category).map(([k, v]: any) => ({
        category: k,
        value: Math.round(((v.passed || 0) / Math.max(v.total, 1)) * 100),
      }))
    : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => (
          <Link to={c.to} key={c.label}>
            <GlowCard delay={i * 0.05} className="relative group cursor-pointer">
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-50 group-hover:opacity-90 transition-opacity"
                style={{ background: `radial-gradient(circle at 100% 0%, ${c.accent}, transparent 55%)` }}
              />
              <div className="flex items-center justify-between mb-3 relative">
                <c.icon className="text-violet1" size={22} />
                <ArrowUpRight size={16} className="text-slate-500 group-hover:text-neon transition relative" />
              </div>
              <div className="text-3xl font-bold tracking-tight relative">{c.val}</div>
              <div className="text-sm text-slate-400 mt-1 relative">{c.label}</div>
              <div className="text-[11px] text-slate-600 mt-2 relative">{c.hint}</div>
            </GlowCard>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlowCard className="lg:col-span-2" delay={0.2}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-slate-400">{t('dashboard.radarTitle')}</div>
              <div className="font-semibold mt-0.5">
                {stats.lastEval ? stats.lastEval.prompt_title || stats.lastEval.prompt_id : t('dashboard.noEval')}
              </div>
            </div>
            {stats.lastEval && (
              <Link to={`/reports/${stats.lastEval.id}`} className="btn-ghost">{t('dashboard.viewReport')}</Link>
            )}
          </div>
          {radar.length ? <RadarChart data={radar} /> : (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-500">
              <Shield size={48} className="mb-3 opacity-40" />
              <div className="text-sm">{t('dashboard.noEvalHint')}</div>
              <Link to="/eval" className="btn mt-4">{t('dashboard.runEval')}</Link>
            </div>
          )}
        </GlowCard>

        <GlowCard delay={0.3}>
          <div className="text-sm text-slate-400 mb-3">{t('dashboard.keyMetrics')}</div>
          {stats.lastEval ? (
            <div className="space-y-3">
              <Metric label={t('dashboard.metricAttack')} value={pct(stats.lastEval.metrics.attack_pass_rate)} good />
              <Metric label={t('dashboard.metricBenign')} value={pct(stats.lastEval.metrics.benign_pass_rate)} good />
              <Metric label={t('dashboard.metricForbidden')} value={pct(stats.lastEval.metrics.forbidden_tool_trigger_rate)} bad />
              <Metric label={t('dashboard.metricLeak')} value={pct(stats.lastEval.metrics.info_leak_rate)} bad />
              <Metric label={t('dashboard.metricJudge')} value={(stats.lastEval.metrics.avg_judge_score || 0).toFixed(2) + ' / 10'} />
            </div>
          ) : (
            <div className="text-slate-500 text-sm">{t('dashboard.noMetrics')}</div>
          )}
        </GlowCard>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-6 glass p-5"
      >
        <div className="text-sm text-slate-400 mb-2">{t('dashboard.quickStart')}</div>
        <ol className="text-sm space-y-2 list-decimal list-inside text-slate-300">
          <li>{t('dashboard.step1')}</li>
          <li>{t('dashboard.step2')}</li>
          <li>{t('dashboard.step3')}</li>
          <li>{t('dashboard.step4')}</li>
          <li>{t('dashboard.step5')}</li>
        </ol>
      </motion.div>
    </div>
  );
}

function Metric({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-mono font-semibold ${good ? 'text-neon' : bad ? 'text-magenta' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function pct(v: number) { return ((v || 0) * 100).toFixed(1) + '%'; }
