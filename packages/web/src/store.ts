import { create } from 'zustand';
import { api } from './api/client';

interface AppStore {
  models: any[];
  prompts: any[];
  sampleSets: any[];
  tools: any[];
  toolProfiles: any[];
  loaded: boolean;
  loadAll: () => Promise<void>;
  refresh: (key?: 'models' | 'prompts' | 'sampleSets' | 'tools' | 'toolProfiles') => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  models: [],
  prompts: [],
  sampleSets: [],
  tools: [],
  toolProfiles: [],
  loaded: false,
  async loadAll() {
    const [models, prompts, sampleSets, tools, toolProfiles] = await Promise.all([
      api.listModels().catch(() => []),
      api.listPrompts().catch(() => []),
      api.listSampleSets().catch(() => []),
      api.listTools().catch(() => []),
      api.listToolProfiles().catch(() => []),
    ]);
    set({ models, prompts, sampleSets, tools, toolProfiles, loaded: true });
  },
  async refresh(key) {
    if (!key || key === 'models') set({ models: await api.listModels().catch(() => get().models) });
    if (!key || key === 'prompts') set({ prompts: await api.listPrompts().catch(() => get().prompts) });
    if (!key || key === 'sampleSets') set({ sampleSets: await api.listSampleSets().catch(() => get().sampleSets) });
    if (!key || key === 'tools') set({ tools: await api.listTools().catch(() => get().tools) });
    if (!key || key === 'toolProfiles') set({ toolProfiles: await api.listToolProfiles().catch(() => get().toolProfiles) });
  },
}));
