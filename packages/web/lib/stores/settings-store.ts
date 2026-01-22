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
  fontSize: 'sm' | 'md' | 'lg';
  showLayerOrigins: boolean;
}

export interface MethodologySettings {
  defaultMethod: 'auto' | 'direct' | 'cod' | 'bot' | 'react' | 'pot' | 'gtp';
  autoRoute: boolean;
  showIndicator: boolean;
}

export interface FeatureSettings {
  depth: boolean;
  depthDensity: 'min' | 'std' | 'max';
  sideCanal: boolean;
  mindMap: boolean;
}

export interface InstinctModeConfig {
  depth: 'standard' | 'deep' | 'profound';
  activeLenses: string[];
  includeSefirot: boolean;
  includeYechidah: boolean;
}

export interface PrivacySettings {
  saveHistory: boolean;
  analytics: boolean;
}

export interface AccountInfo {
  tier: 'FREE' | 'PRO';
  queriesUsedToday: number;
  tokensUsed: number;
}

export interface Settings {
  apiKeys: ApiKeys;
  modelConfig: ModelConfig;
  consensus: ConsensusSettings;
  appearance: AppearanceSettings;
  methodology: MethodologySettings;
  features: FeatureSettings;
  instinctMode: boolean;
  instinctConfig: InstinctModeConfig;
  privacy: PrivacySettings;
  account: AccountInfo;
}

interface SettingsStore {
  settings: Settings;
  loading: boolean;
  error: string | null;
  updateApiKey: (provider: keyof ApiKeys, key: string) => void;
  updateModelConfig: (field: keyof ModelConfig, value: string) => void;
  updateConsensus: (field: keyof ConsensusSettings, value: number) => void;
  updateAppearance: (field: keyof AppearanceSettings, value: any) => void;
  updateMethodology: (field: keyof MethodologySettings, value: any) => void;
  updateFeatures: (field: keyof FeatureSettings, value: any) => void;
  setInstinctMode: (enabled: boolean) => void;
  setInstinctConfig: (config: Partial<InstinctModeConfig>) => void;
  updatePrivacy: (field: keyof PrivacySettings, value: boolean) => void;
  clearAllData: () => void;
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
    motherBase: 'claude-opus-4-5-20251101',
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
    fontSize: 'md',
    showLayerOrigins: false,
  },
  methodology: {
    defaultMethod: 'auto',
    autoRoute: true,
    showIndicator: true,
  },
  features: {
    depth: true,
    depthDensity: 'std',
    sideCanal: true,
    mindMap: false,
  },
  instinctMode: false,
  instinctConfig: {
    depth: 'deep',
    activeLenses: ['exoteric', 'esoteric', 'gnostic', 'hermetic', 'kabbalistic', 'alchemical', 'prophetic'],
    includeSefirot: true,
    includeYechidah: true,
  },
  privacy: {
    saveHistory: true,
    analytics: false,
  },
  account: {
    tier: 'FREE',
    queriesUsedToday: 0,
    tokensUsed: 0,
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

      updateMethodology: (field, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            methodology: {
              ...state.settings.methodology,
              [field]: value,
            },
          },
        }));
      },

      updateFeatures: (field, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            features: {
              ...state.settings.features,
              [field]: value,
            },
          },
        }));
      },

      setInstinctMode: (enabled) => {
        set((state) => ({
          settings: {
            ...state.settings,
            instinctMode: enabled,
          },
        }));
      },

      setInstinctConfig: (config) => {
        set((state) => ({
          settings: {
            ...state.settings,
            instinctConfig: {
              ...state.settings.instinctConfig,
              ...config,
            },
          },
        }));
      },

      updatePrivacy: (field, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            privacy: {
              ...state.settings.privacy,
              [field]: value,
            },
          },
        }));
      },

      clearAllData: () => {
        // Clear localStorage
        localStorage.clear();
        // Reset settings
        set({ settings: defaultSettings, loading: false, error: null });
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
      merge: (persistedState: any, currentState: SettingsStore) => {
        // Merge persisted settings with defaults to handle new fields
        const mergedSettings = {
          ...defaultSettings,
          ...persistedState?.settings,
          appearance: {
            ...defaultSettings.appearance,
            ...persistedState?.settings?.appearance,
          },
          methodology: {
            ...defaultSettings.methodology,
            ...persistedState?.settings?.methodology,
          },
          features: {
            ...defaultSettings.features,
            ...persistedState?.settings?.features,
          },
          instinctMode: persistedState?.settings?.instinctMode ?? defaultSettings.instinctMode,
          instinctConfig: {
            ...defaultSettings.instinctConfig,
            ...persistedState?.settings?.instinctConfig,
          },
          privacy: {
            ...defaultSettings.privacy,
            ...persistedState?.settings?.privacy,
          },
          account: {
            ...defaultSettings.account,
            ...persistedState?.settings?.account,
          },
          apiKeys: {
            ...defaultSettings.apiKeys,
            ...persistedState?.settings?.apiKeys,
          },
          modelConfig: {
            ...defaultSettings.modelConfig,
            ...persistedState?.settings?.modelConfig,
          },
          consensus: {
            ...defaultSettings.consensus,
            ...persistedState?.settings?.consensus,
          },
        }

        return {
          ...currentState,
          settings: mergedSettings,
        }
      },
    }
  )
);
