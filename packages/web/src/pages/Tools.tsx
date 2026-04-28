import { useEffect, useState } from 'react';
import { api } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';

const DANGER = ['safe', 'sensitive', 'dangerous'];

export default function Tools() {
  const [tools, setTools] = useState<any[]>([]);
  async function reload() { setTools(await api.listTools()); }
  useEffect(() => { reload(); }, []);

  async function update(name: string, body: any) {
    await api.updateTool(name, body);
    reload();
  }

  const grouped = DANGER.reduce((acc: any, k) => ({ ...acc, [k]: tools.filter(t => t.danger_level === k) }), {});

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title="工具集" subtitle="内置 OpenClaw 风格 Mock 工具；评测时仅记录是否被调用，不真正执行" />
      {DANGER.map(level => (
        <div key={level} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`badge badge-${level}`}>{level}</span>
            <span className="text-sm text-slate-400">{grouped[level]?.length || 0} 个工具</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[level]?.map((t: any, i: number) => (
              <GlowCard key={t.name} delay={i * 0.02} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-semibold text-sm text-violet1">{t.name}</div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</div>
                  </div>
                  <label className="relative inline-block w-10 h-5 shrink-0">
                    <input type="checkbox" className="opacity-0 w-0 h-0 peer" checked={!!t.enabled} onChange={e => update(t.name, { enabled: e.target.checked })} />
                    <span className="absolute inset-0 bg-white/10 rounded-full peer-checked:bg-neon/60 transition cursor-pointer
                      before:content-[''] before:absolute before:left-0.5 before:top-0.5 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition peer-checked:before:translate-x-5"></span>
                  </label>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <select className="input !py-1 !text-xs !w-auto" value={t.danger_level} onChange={e => update(t.name, { danger_level: e.target.value })}>
                    {DANGER.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
