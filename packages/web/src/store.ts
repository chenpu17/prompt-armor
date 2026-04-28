import { create } from 'zustand';
import { api } from './api/client';

interface AppStore {
  models: any[];
  prompts: any[];
  sampleSets: any[];
  tools: any[];
  loaded: boolean;
  loadAll: () => Promise<void>;
  refresh: (key?: 'models' | 'prompts' | 'sampleSets' | 'tools') => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  models: [],
  prompts: [],
  sampleSets: [],
  tools: [],
  loaded: false,
  async loadAll() {
    const [models, prompts, sampleSets, tools] = await Promise.all([
      api.listModels().catch(() => []),
      api.listPrompts().catch(() => []),
      api.listSampleSets().catch(() => []),
      api.listTools().catch(() => []),
    ]);
    set({ models, prompts, sampleSets, tools, loaded: true });
  },
  async refresh(key) {
    if (!key || key === 'models') set({ models: await api.listModels().catch(() => get().models) });
    if (!key || key === 'prompts') set({ prompts: await api.listPrompts().catch(() => get().prompts) });
    if (!key || key === 'sampleSets') set({ sampleSets: await api.listSampleSets().catch(() => get().sampleSets) });
    if (!key || key === 'tools') set({ tools: await api.listTools().catch(() => get().tools) });
  },
}));
