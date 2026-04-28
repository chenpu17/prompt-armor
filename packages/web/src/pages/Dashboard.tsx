import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';
import RadarChart from '../components/RadarChart';
import { Activity, Shield, Cpu, Target as TargetIcon, FileText, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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
    { icon: Cpu, label: '已配置模型', val: stats.models, hint: 'PromptGen / Attack / Target / Judge', accent: 'rgba(124,77,255,0.45)', to: '/models' },
    { icon: FileText, label: '防护提示词版本', val: stats.prompts, hint: '基线 + 生成 + 优化', accent: 'rgba(236,72,153,0.45)', to: '/prompts' },
    { icon: TargetIcon, label: '攻击样本总数', val: stats.samples, hint: '红队 + 正常对照', accent: 'rgba(6,255,165,0.45)', to: '/samples' },
    { icon: Activity, label: '历史评测次数', val: stats.evals, hint: '可在报告页查看详情', accent: 'rgba(124,77,255,0.45)', to: '/reports' },
  ];

  const radar = stats.lastEval?.metrics?.per_category
    ? Object.entries(stats.lastEval.metrics.per_category).map(([k, v]: any) => ({
        category: k,
        value: Math.round(((v.passed || 0) / Math.max(v.total, 1)) * 100),
      }))
    : [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="LLM 防护提示词工厂" subtitle="生成 · 优化 · 评测 — 让你的 AI 应用拥有可量化的安全策略" />
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
              <div className="text-sm text-slate-400">最近一次评测 · 分类通过率雷达</div>
              <div className="font-semibold mt-0.5">
                {stats.lastEval ? stats.lastEval.prompt_title || stats.lastEval.prompt_id : '尚无评测数据'}
              </div>
            </div>
            {stats.lastEval && (
              <Link to={`/reports/${stats.lastEval.id}`} className="btn-ghost">查看报告</Link>
            )}
          </div>
          {radar.length ? <RadarChart data={radar} /> : (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-500">
              <Shield size={48} className="mb-3 opacity-40" />
              <div className="text-sm">先去【运行评测】跑一次，看看你的提示词扛不扛打</div>
              <Link to="/eval" className="btn mt-4">运行评测 →</Link>
            </div>
          )}
        </GlowCard>

        <GlowCard delay={0.3}>
          <div className="text-sm text-slate-400 mb-3">关键指标</div>
          {stats.lastEval ? (
            <div className="space-y-3">
              <Metric label="攻击拒绝率" value={pct(stats.lastEval.metrics.attack_pass_rate)} good />
              <Metric label="正常通过率" value={pct(stats.lastEval.metrics.benign_pass_rate)} good />
              <Metric label="危险工具误触发" value={pct(stats.lastEval.metrics.forbidden_tool_trigger_rate)} bad />
              <Metric label="信息泄露率" value={pct(stats.lastEval.metrics.info_leak_rate)} bad />
              <Metric label="平均裁判分" value={(stats.lastEval.metrics.avg_judge_score || 0).toFixed(2) + ' / 10'} />
            </div>
          ) : (
            <div className="text-slate-500 text-sm">完成首次评测后这里会显示。</div>
          )}
        </GlowCard>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-6 glass p-5"
      >
        <div className="text-sm text-slate-400 mb-2">快速开始</div>
        <ol className="text-sm space-y-2 list-decimal list-inside text-slate-300">
          <li>到【模型管理】配置 4 个角色：生成器 / 攻击样本生成器 / 被评测目标 / 裁判（OpenAI 兼容协议）</li>
          <li>查看【工具集】并按需勾选要传给目标模型的工具（默认全开）</li>
          <li>到【攻击样本】查看内置红队样本集，或一键生成更多</li>
          <li>到【运行评测】选择 Prompt + 样本集 + 模型，开始评测</li>
          <li>评测结束后到【评测报告】查看结果，并基于失败用例【一键优化】Prompt</li>
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
