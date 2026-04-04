import type {
  Settings,
  AppearanceSettings,
  MethodologySettings,
  FeatureSettings,
  PrivacySettings,
} from '@/lib/stores/settings-store';

export interface UserProfile {
  id: string;
  github_username?: string;
  github_email?: string;
  wallet_address?: string;
  created_at: number;
  last_login: number;
  social_connections?: SocialConnection[];
}

export interface SocialConnection {
  platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube';
  user_id: string;
  username: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  connected_at: number;
}

export interface SettingsTabProps {
  settings: Settings;
  user: UserProfile;
  updateAppearance: (field: keyof AppearanceSettings, value: any) => void;
  updateMethodology: (field: keyof MethodologySettings, value: any) => void;
  updateFeatures: (field: keyof FeatureSettings, value: any) => void;
  updatePrivacy: (field: keyof PrivacySettings, value: boolean) => void;
  clearAllData: () => void;
}
