import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Cpu, FileText, Target as TargetIcon, Wrench, PlayCircle, BarChart3, Settings as SettingsIcon, Rocket } from 'lucide-react';
import { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import Prompts from './pages/Prompts';
import Samples from './pages/Samples';
import Tools from './pages/Tools';
import EvalRun from './pages/EvalRun';
import EvalReport from './pages/EvalReport';
import AutoPilot from './pages/AutoPilot';
import Settings from './pages/Settings';
import ParticleBg from './components/ParticleBg';
import { useStore } from './store';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: '总览' },
  { to: '/models', icon: Cpu, label: '模型管理' },
  { to: '/prompts', icon: FileText, label: '防护提示词' },
  { to: '/samples', icon: TargetIcon, label: '攻击样本' },
  { to: '/tools', icon: Wrench, label: '工具集' },
  { to: '/eval', icon: PlayCircle, label: '运行评测' },
  { to: '/reports', icon: BarChart3, label: '评测报告' },
  { to: '/auto', icon: Rocket, label: '自动优化' },
  { to: '/settings', icon: SettingsIcon, label: '系统设置' },
];

export default function App() {
  const loadAll = useStore(s => s.loadAll);
  useEffect(() => { loadAll(); }, [loadAll]);
  return (
    <div className="relative min-h-screen flex">
      <ParticleBg />
      <aside className="w-60 shrink-0 p-5 border-r border-white/5 relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet1 to-neon shadow-glow flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight grad-text">Prompt Armor</div>
            <div className="text-[10px] text-slate-500 tracking-widest">LLM SECURITY FORGE</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(n => (
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
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 text-[10px] text-slate-600 leading-relaxed">
          v0.1.0 · 数据存储于<br /><span className="font-mono">~/.prompt-armor/</span>
        </div>
      </aside>
      <main className="flex-1 relative z-10 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
