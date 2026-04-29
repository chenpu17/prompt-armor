import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const cur = i18n.resolvedLanguage || 'zh';
  const next = cur.startsWith('zh') ? 'en' : 'zh';
  const label = next === 'en' ? 'EN' : '中';
  const tip = next === 'en' ? 'English' : '中文';
  return (
    <button
      onClick={() => i18n.changeLanguage(next)}
      title={tip}
      className={`flex items-center gap-1.5 rounded-lg border border-white/10 hover:border-violet1/50 hover:bg-white/5 transition text-slate-300 hover:text-white ${
        compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      <Languages size={compact ? 12 : 14} />
      <span className="font-mono">{label}</span>
    </button>
  );
}
