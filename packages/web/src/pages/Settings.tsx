import { useEffect, useState } from 'react';
import GlowCard, { PageHeader } from '../components/GlowCard';
import { Settings as SettingsIcon, Save, RotateCcw, Eye } from 'lucide-react';

type SettingItem = { value: string; default: string; description: string; updated_at: number | null };

export default function Settings() {
  const [data, setData] = useState<Record<string, SettingItem> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showDefault, setShowDefault] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await fetch('/api/settings');
    const j = await r.json();
    setData(j);
    const d: Record<string, string> = {};
    for (const k of Object.keys(j)) d[k] = j[k].value || '';
    setDraft(d);
  }
  useEffect(() => { load(); }, []);

  async function save(key: string) {
    setSaving(key);
    try {
      const r = await fetch('/api/settings/' + key, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: draft[key] || '' }),
      });
      if (!r.ok) throw new Error(await r.text());
      setMsg('已保存：' + key);
      await load();
    } catch (e: any) {
      setMsg('保存失败: ' + e.message);
    } finally {
      setSaving(null);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function reset(key: string) {
    if (!confirm('恢复为内置默认（清空自定义）？')) return;
    await fetch('/api/settings/' + key, { method: 'DELETE' });
    await load();
    setMsg('已恢复默认：' + key);
    setTimeout(() => setMsg(null), 2500);
  }

  if (!data) return <div className="p-8 text-slate-500">加载中…</div>;

  const labels: Record<string, string> = {
    judge_system_prompt: '评测裁判 System Prompt',
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader title="系统设置" subtitle="自定义 AI 角色的系统提示词等内部参数" icon={SettingsIcon} />
      {msg && <div className="mb-4 px-4 py-2 rounded-lg bg-violet1/20 border border-violet1/40 text-sm">{msg}</div>}

      <div className="space-y-6">
        {Object.entries(data).map(([key, item]) => {
          const isCustom = (item.value || '').trim().length > 0;
          const showDef = !!showDefault[key];
          return (
            <GlowCard key={key}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    {labels[key] || key}
                    {isCustom ? (
                      <span className="badge badge-medium">已自定义</span>
                    ) : (
                      <span className="badge badge-low">使用默认</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs" onClick={() => setShowDefault(s => ({ ...s, [key]: !s[key] }))}>
                    <Eye size={14} />{showDef ? '隐藏默认' : '查看默认'}
                  </button>
                  {isCustom && (
                    <button className="btn-ghost text-xs" onClick={() => reset(key)}>
                      <RotateCcw size={14} />恢复默认
                    </button>
                  )}
                </div>
              </div>
              {showDef && (
                <pre className="text-[11px] text-slate-400 bg-black/40 border border-white/10 rounded-lg p-3 mb-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono">{item.default}</pre>
              )}
              <textarea
                className="input min-h-[260px] font-mono text-xs"
                value={draft[key] ?? ''}
                onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                placeholder={`留空则使用内置默认。\n\n${item.default.slice(0, 200)}…`}
              />
              <div className="flex justify-end mt-3">
                <button className="btn" disabled={saving === key} onClick={() => save(key)}>
                  <Save size={16} />{saving === key ? '保存中…' : '保存'}
                </button>
              </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
