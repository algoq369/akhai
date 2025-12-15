import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiKeys {
  anthropic: string;
  deepseek: string;
  xai: string;
  openrouter: string;
}

export interface ModelConfig {
  motherBase: string;
  slot1: string;
  slot2: string;
}

export interface ConsensusSettings {
  maxRounds: number;
  timeoutSeconds: number;
  autoApproveThreshold: number;
}

export interface AppearanceSettings {
  compactView: boolean;
}

export interface Settings {
  apiKeys: ApiKeys;
  modelConfig: ModelConfig;
  consensus: ConsensusSettings;
  appearance: AppearanceSettings;
}

interface SettingsStore {
  settings: Settings;
  loading: boolean;
  error: string | null;
  updateApiKey: (provider: keyof ApiKeys, key: string) => void;
  updateModelConfig: (field: keyof ModelConfig, value: string) => void;
  updateConsensus: (field: keyof ConsensusSettings, value: number) => void;
  updateAppearance: (field: keyof AppearanceSettings, value: boolean) => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  apiKeys: {
    anthropic: '',
    deepseek: '',
    xai: '',
    openrouter: '',
  },
  modelConfig: {
    motherBase: 'claude-sonnet-4-20250514',
    slot1: 'deepseek-chat',
    slot2: 'grok-3',
  },
  consensus: {
    maxRounds: 3,
    timeoutSeconds: 30,
    autoApproveThreshold: 85,
  },
  appearance: {
    compactView: false,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      loading: false,
      error: null,

      updateApiKey: (provider, key) => {
        set((state) => ({
          settings: {
            ...state.settings,
            apiKeys: {
              ...state.settings.apiKeys,
              [provider]: key,
            },
          },
        }));
      },

      updateModelConfig: (field, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            modelConfig: {
              ...state.settings.modelConfig,
              [field]: value,
            },
          },
        }));
      },

      updateConsensus: (field, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            consensus: {
              ...state.settings.consensus,
              [field]: value,
            },
          },
        }));
      },

      updateAppearance: (field, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: {
              ...state.settings.appearance,
              [field]: value,
            },
          },
        }));
      },

      saveSettings: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(get().settings),
          });
          if (!response.ok) throw new Error('Failed to save settings');
          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false,
          });
        }
      },

      loadSettings: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/settings');
          if (!response.ok) throw new Error('Failed to load settings');
          const data = await response.json();
          set({ settings: data, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false,
          });
        }
      },

      resetSettings: () => {
        set({ settings: defaultSettings, loading: false, error: null });
      },
    }),
    {
      name: 'akhai-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
