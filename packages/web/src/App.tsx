import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Cpu, FileText, Target as TargetIcon, Wrench, PlayCircle, BarChart3, Settings as SettingsIcon, Rocket, BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import Prompts from './pages/Prompts';
import Samples from './pages/Samples';
import Tools from './pages/Tools';
import EvalRun from './pages/EvalRun';
import EvalReport from './pages/EvalReport';
import AutoPilot from './pages/AutoPilot';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';
import Help from './pages/Help';
import ParticleBg from './components/ParticleBg';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useStore } from './store';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/models',    icon: Cpu,             key: 'models' },
  { to: '/prompts',   icon: FileText,        key: 'prompts' },
  { to: '/samples',   icon: TargetIcon,      key: 'samples' },
  { to: '/tools',     icon: Wrench,          key: 'tools' },
  { to: '/eval',      icon: PlayCircle,      key: 'eval' },
  { to: '/reports',   icon: BarChart3,       key: 'reports' },
  { to: '/auto',      icon: Rocket,          key: 'auto' },
  { to: '/help',      icon: BookOpen,        key: 'help' },
  { to: '/settings',  icon: SettingsIcon,    key: 'settings' },
];

function Shell() {
  const loadAll = useStore(s => s.loadAll);
  const { t } = useTranslation();
  useEffect(() => { loadAll(); }, [loadAll]);
  return (
    <div className="relative min-h-screen flex">
      <ParticleBg />
      <aside className="w-60 shrink-0 p-5 border-r border-white/5 relative z-10 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet1 to-neon shadow-glow flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight grad-text">{t('app.name')}</div>
            <div className="text-[10px] text-slate-500 tracking-widest">{t('app.tagline')}</div>
          </div>
        </div>
        <div className="mb-4">
          <LanguageSwitcher />
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet1/20 to-magenta/10 border border-violet1/40 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <n.icon size={16} />
              {t(`nav.${n.key}`)}
            </NavLink>
          ))}
        </nav>
        <div className="text-[10px] text-slate-600 leading-relaxed mt-4">
          v0.3.0 · {t('app.footer')}<br /><span className="font-mono">~/.prompt-armor/</span>
        </div>
      </aside>
      <main className="flex-1 relative z-10 overflow-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/models" element={<Models />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/samples" element={<Samples />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/eval" element={<EvalRun />} />
          <Route path="/eval/:id" element={<EvalRun />} />
          <Route path="/reports" element={<EvalReport />} />
          <Route path="/reports/:id" element={<EvalReport />} />
          <Route path="/auto" element={<AutoPilot />} />
          <Route path="/auto/:id" element={<AutoPilot />} />
          <Route path="/help" element={<Help />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/welcome') {
    return <Welcome />;
  }
  return <Shell />;
}
