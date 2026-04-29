import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import GlowCard, { PageHeader } from '../components/GlowCard';

const DANGER = ['safe', 'sensitive', 'dangerous'];

function ProfilesSection() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allTools, setAllTools] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function reload() {
    const [p, t2] = await Promise.all([api.listToolProfiles(), api.listTools()]);
    setProfiles(p);
    setAllTools(t2);
  }
  useEffect(() => { reload(); }, []);

  async function deleteProfile(id: string) {
    if (!confirm(t('tools.profileDeleteConfirm') || 'Delete this profile?')) return;
    await api.deleteToolProfile(id);
    reload();
  }

  async function createProfile() {
    if (!newName.trim()) return;
    await api.createToolProfile({ name: newName.trim(), description: newDesc.trim(), tool_names: JSON.stringify([...selected]) });
    setCreating(false); setNewName(''); setNewDesc(''); setSelected(new Set());
    reload();
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('tools.profiles')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('tools.profilesDesc')}</p>
        </div>
        <button className="btn-primary text-sm py-1.5 px-4" onClick={() => setCreating(c => !c)}>
          + {t('tools.profileNew')}
        </button>
      </div>

      {creating && (
        <GlowCard className="mb-4 !p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label mb-1">{t('tools.profileNameLabel')}</label>
              <input className="input" placeholder="My Agent Profile" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="label mb-1">{t('tools.profilesDesc').split('；')[0]}</label>
              <input className="input" placeholder="描述..." value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
          </div>
          <div className="mb-3 text-xs text-slate-400">{selected.size} / {allTools.filter(t2 => t2.enabled).length} {t('tools.profileToolCount')} selected</div>
          <div className="max-h-48 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-4 p-1">
            {allTools.filter(t2 => t2.enabled).map((tool: any) => (
              <label key={tool.name} className={`flex items-center gap-1.5 cursor-pointer rounded px-2 py-1 text-xs ${selected.has(tool.name) ? 'bg-violet1/20 text-violet1' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                <input type="checkbox" className="w-3 h-3" checked={selected.has(tool.name)} onChange={e => {
                  const s = new Set(selected);
                  e.target.checked ? s.add(tool.name) : s.delete(tool.name);
                  setSelected(s);
                }} />
                <span className="font-mono">{tool.name}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm py-1.5 px-4" onClick={createProfile}>{t('tools.profileNew')}</button>
            <button className="btn-ghost text-sm py-1.5 px-4" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </GlowCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((p: any) => {
          const names: string[] = JSON.parse(p.tool_names || '[]');
          return (
            <GlowCard key={p.id} className="!p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{p.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.is_builtin ? 'bg-violet1/20 text-violet1' : 'bg-neon/20 text-neon'}`}>
                      {p.is_builtin ? t('tools.profileBuiltin') : t('tools.profileCustom')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{p.description}</div>
                  <div className="text-xs text-neon mt-2">{names.length} {t('tools.profileToolCount')}</div>
                  <div className="mt-2 flex flex-wrap gap-1 max-h-20 overflow-hidden">
                    {names.slice(0, 12).map((n: string) => (
                      <span key={n} className="text-[10px] font-mono bg-white/5 text-slate-400 px-1.5 py-0.5 rounded">{n}</span>
                    ))}
                    {names.length > 12 && <span className="text-[10px] text-slate-500">+{names.length - 12}</span>}
                  </div>
                </div>
                {!p.is_builtin && (
                  <button className="text-slate-500 hover:text-red-400 transition text-xs shrink-0" onClick={() => deleteProfile(p.id)}>
                    {t('tools.profileDelete')}
                  </button>
                )}
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}

export default function Tools() {
  const { t } = useTranslation();
  const [tools, setTools] = useState<any[]>([]);
  async function reload() { setTools(await api.listTools()); }
  useEffect(() => { reload(); }, []);

  async function update(name: string, body: any) {
    await api.updateTool(name, body);
    reload();
  }

  const grouped = DANGER.reduce((acc: any, k) => ({ ...acc, [k]: tools.filter(tool => tool.danger_level === k) }), {});

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title={t('tools.title')} subtitle={t('tools.subtitle')} />
      <ProfilesSection />
      {DANGER.map(level => (
        <div key={level} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`badge badge-${level}`}>{level}</span>
            <span className="text-sm text-slate-400">{t('tools.toolCount', { count: grouped[level]?.length || 0 })}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[level]?.map((tool: any, i: number) => (
              <GlowCard key={tool.name} delay={i * 0.02} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-semibold text-sm text-violet1">{tool.name}</div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{tool.description}</div>
                  </div>
                  <label className="relative inline-block w-10 h-5 shrink-0">
                    <input type="checkbox" className="opacity-0 w-0 h-0 peer" checked={!!tool.enabled} onChange={e => update(tool.name, { enabled: e.target.checked })} />
                    <span className="absolute inset-0 bg-white/10 rounded-full peer-checked:bg-neon/60 transition cursor-pointer
                      before:content-[''] before:absolute before:left-0.5 before:top-0.5 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition peer-checked:before:translate-x-5"></span>
                  </label>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <select className="input !py-1 !text-xs !w-auto" value={tool.danger_level} onChange={e => update(tool.name, { danger_level: e.target.value })}>
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
