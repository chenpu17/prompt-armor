import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Book, Cpu, Target, FileText, PlayCircle, Rocket, HelpCircle } from 'lucide-react';
import GlowCard from '../components/GlowCard';

const SECTIONS = [
  { id: 'intro',   icon: Book },
  { id: 'models',  icon: Cpu },
  { id: 'samples', icon: Target },
  { id: 'prompts', icon: FileText },
  { id: 'eval',    icon: PlayCircle },
  { id: 'auto',    icon: Rocket },
  { id: 'tips',    icon: HelpCircle },
] as const;

export default function Help() {
  const { t } = useTranslation();
  const [active, setActive] = useState<string>('intro');

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold grad-text mb-2">{t('help.title')}</h1>
        <p className="text-slate-400">{t('help.subtitle')}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* TOC */}
        <aside className="col-span-12 md:col-span-3">
          <GlowCard>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">{t('help.toc')}</div>
            <ul className="flex flex-col gap-1">
              {SECTIONS.map(s => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      setActive(s.id);
                      document.getElementById('sec-' + s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                      active === s.id
                        ? 'bg-violet1/15 border border-violet1/40 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <s.icon size={14} />
                    <span className="truncate">{t(`help.sections.${s.id}.title`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </GlowCard>
        </aside>

        {/* Body */}
        <main className="col-span-12 md:col-span-9 space-y-5">
          {SECTIONS.map(s => (
            <section key={s.id} id={'sec-' + s.id}>
              <GlowCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet1/30 to-magenta/30 flex items-center justify-center">
                    <s.icon size={18} className="text-violet-200" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{t(`help.sections.${s.id}.title`)}</h2>
                </div>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
                  {t(`help.sections.${s.id}.body`)}
                </div>
              </GlowCard>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
