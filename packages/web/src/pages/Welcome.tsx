import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Sparkles, FlaskConical, Activity, Rocket, Cpu, Zap,
  ArrowRight, Github, BookOpen, Star, Terminal,
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SCREENS = [
  { src: '/screenshots/auto-pilot.png',  k: 'auto' },
  { src: '/screenshots/reports.png',     k: 'eval' },
  { src: '/screenshots/prompts.png',     k: 'generate' },
  { src: '/screenshots/samples.png',     k: 'samples' },
];

const FEATURES = [
  { k: 'generate', Icon: Sparkles,     gradient: 'from-violet-500 to-fuchsia-500' },
  { k: 'samples',  Icon: FlaskConical, gradient: 'from-cyan-500 to-blue-500' },
  { k: 'eval',     Icon: Activity,     gradient: 'from-emerald-500 to-teal-500' },
  { k: 'auto',     Icon: Rocket,       gradient: 'from-amber-500 to-pink-500' },
  { k: 'models',   Icon: Cpu,          gradient: 'from-indigo-500 to-violet-500' },
  { k: 'stream',   Icon: Zap,          gradient: 'from-rose-500 to-orange-500' },
] as const;

export default function Welcome() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = 'Prompt Armor — ' + t('app.tagline');
  }, [t]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0b0b14]">
      {/* gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/30 blur-[140px]" />
      <div className="pointer-events-none absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-fuchsia-500/15 blur-[160px]" />

      {/* top bar */}
      <header className="relative z-20 max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet1 to-neon shadow-glow flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight grad-text">{t('app.name')}</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase">{t('app.tagline')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/chenpu17/prompt-armor" target="_blank" rel="noreferrer"
             className="hidden sm:flex items-center gap-2 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-violet1/50 transition">
            <Github size={14} /> {t('welcome.hero.ctaGithub')}
          </a>
          <LanguageSwitcher />
          <Link to="/dashboard"
                className="text-sm bg-gradient-to-r from-violet1 to-magenta px-4 py-1.5 rounded-lg shadow-glow text-white hover:opacity-90 transition flex items-center gap-1.5">
            {t('welcome.hero.ctaStart')} <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet1/40 bg-violet1/10 text-violet-200 text-xs mb-6 tracking-wider">
          <Star size={12} className="fill-violet-300 text-violet-300" />
          {t('welcome.hero.badge')}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
          <span className="text-white">{t('welcome.hero.title1')}</span>{' '}
          <span className="grad-text">{t('welcome.hero.title2')}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed">
          {t('welcome.hero.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/auto"
                className="group bg-gradient-to-r from-violet1 to-magenta px-7 py-3 rounded-xl text-white font-semibold shadow-glow flex items-center gap-2 hover:scale-[1.03] transition-transform">
            <Rocket size={18} /> {t('welcome.hero.ctaStart')}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/help"
                className="px-7 py-3 rounded-xl border border-white/15 text-slate-200 hover:border-violet1/60 hover:bg-white/5 transition flex items-center gap-2">
            <BookOpen size={18} /> {t('welcome.hero.ctaDocs')}
          </Link>
        </motion.div>

        {/* stats strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { num: '10+', k: 'categories' },
            { num: '25+', k: 'tools' },
            { num: '4',   k: 'models' },
            { num: '∞',   k: 'loop' },
          ].map((s, i) => (
            <div key={i}
                 className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur p-5">
              <div className="text-3xl md:text-4xl font-bold grad-text">{s.num}</div>
              <div className="mt-2 text-xs uppercase tracking-wider text-slate-400">{t(`welcome.stats.${s.k}`)}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3"><span className="grad-text">{t('welcome.features.title')}</span></h2>
          <p className="text-slate-400">{t('welcome.features.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, idx) => (
            <motion.div
              key={f.k}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur p-6 overflow-hidden hover:border-violet1/40 transition">
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${f.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-glow`}>
                <f.Icon size={22} className="text-white" />
              </div>
              <h3 className="font-semibold text-lg text-white mb-2">{t(`welcome.features.${f.k}.title`)}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{t(`welcome.features.${f.k}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* screens */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3"><span className="grad-text">{t('welcome.screens.title')}</span></h2>
          <p className="text-slate-400">{t('welcome.screens.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCREENS.map((s, idx) => (
            <motion.div
              key={s.src}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-violet1/10 via-fuchsia-500/5 to-cyan-500/10 p-2 hover:border-violet1/40 transition overflow-hidden">
              <div className="absolute -inset-px bg-gradient-to-br from-violet1/30 to-magenta/30 rounded-2xl opacity-0 group-hover:opacity-100 blur transition pointer-events-none" />
              <img src={s.src} alt={s.k}
                   className="relative rounded-xl w-full aspect-[16/10] object-cover object-top border border-white/5"
                   onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-sm">
                <span className="text-white font-medium drop-shadow">{t(`welcome.features.${s.k}.title`)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* install */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3"><span className="grad-text">{t('welcome.install.title')}</span></h2>
        <p className="text-slate-400 mb-8">{t('welcome.install.subtitle')}</p>
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 text-left font-mono text-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-3 uppercase tracking-wider">
            <Terminal size={12} /> shell
          </div>
          <pre className="text-emerald-300"><code>{`# Install globally
$ npm i -g @chenpu17/prompt-armor

# Launch (opens browser automatically)
$ prompt-armor`}</code></pre>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">© {new Date().getFullYear()} Prompt Armor · {t('welcome.footer.tagline')}</div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <a href="https://github.com/chenpu17/prompt-armor" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1"><Github size={12} /> GitHub</a>
            <span>·</span>
            <a href="https://www.npmjs.com/package/@chenpu17/prompt-armor" target="_blank" rel="noreferrer" className="hover:text-white">npm</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
