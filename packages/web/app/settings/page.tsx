'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';
import ApiKeyInput from '@/components/ApiKeyInput';
import ModelSelector from '@/components/ModelSelector';
import RangeInput from '@/components/RangeInput';
import ToggleSwitch from '@/components/ToggleSwitch';
import { LiquidEther } from '@/components/ui/LiquidEther';
import { DecryptedTitle } from '@/components/ui/DecryptedText';

export default function SettingsPage() {
  const {
    settings,
    loading,
    error,
    updateApiKey,
    updateModelConfig,
    updateConsensus,
    updateAppearance,
    saveSettings,
    loadSettings,
  } = useSettingsStore();

  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({
    anthropic: null,
    deepseek: null,
    xai: null,
    openrouter: null,
  });
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const testApiKey = async (provider: string) => {
    setTesting(provider);
    setTestResults((prev) => ({ ...prev, [provider]: null }));

    try {
      const key = settings.apiKeys[provider as keyof typeof settings.apiKeys];
      const response = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      });

      const result = await response.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: result.success ? 'success' : 'error',
      }));
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [provider]: 'error' }));
    } finally {
      setTesting(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    await saveSettings();
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading && !settings) {
    return (
      <>
        <LiquidEther />
        <div className="min-h-screen pt-16 flex items-center justify-center relative">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-gray-500 mt-4 text-sm">Loading settings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LiquidEther />
      <div className="min-h-screen pt-16 relative">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <DecryptedTitle
              text="Settings"
              className="text-2xl font-bold text-white"
              speed={20}
            />
            <p className="text-gray-500 mt-1 text-sm font-light">
              Configure your AkhAI preferences and API keys
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-6 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <p className="text-white text-sm">Settings saved successfully!</p>
            </div>
          )}

        {/* API Keys Section */}
        <section className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-base font-semibold text-white mb-2">
            API Keys
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your API keys for each provider. Keys are stored securely and never exposed in full.
          </p>
          <div className="space-y-4">
            <ApiKeyInput
              label="Anthropic (Mother Base)"
              provider="anthropic"
              value={settings.apiKeys.anthropic}
              onChange={(v) => updateApiKey('anthropic', v)}
              onTest={() => testApiKey('anthropic')}
              testResult={testResults.anthropic}
              testing={testing === 'anthropic'}
            />
            <ApiKeyInput
              label="DeepSeek (Advisor Slot 1)"
              provider="deepseek"
              value={settings.apiKeys.deepseek}
              onChange={(v) => updateApiKey('deepseek', v)}
              onTest={() => testApiKey('deepseek')}
              testResult={testResults.deepseek}
              testing={testing === 'deepseek'}
            />
            <ApiKeyInput
              label="Grok / xAI (Advisor Slot 2)"
              provider="xai"
              value={settings.apiKeys.xai}
              onChange={(v) => updateApiKey('xai', v)}
              onTest={() => testApiKey('xai')}
              testResult={testResults.xai}
              testing={testing === 'xai'}
            />
            <ApiKeyInput
              label="OpenRouter (Advisor Slot 3 - FIXED)"
              provider="openrouter"
              value={settings.apiKeys.openrouter}
              onChange={(v) => updateApiKey('openrouter', v)}
              onTest={() => testApiKey('openrouter')}
              testResult={testResults.openrouter}
              testing={testing === 'openrouter'}
            />
          </div>
        </section>

        {/* Model Configuration */}
        <section className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-base font-semibold text-white mb-2">
            Model Configuration
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Select the default models for each advisor slot.
          </p>
          <div className="space-y-2">
            <ModelSelector
              label="Mother Base Model"
              value={settings.modelConfig.motherBase}
              onChange={(v) => updateModelConfig('motherBase', v)}
              provider="anthropic"
            />
            <ModelSelector
              label="Advisor Slot 1 (Technical)"
              value={settings.modelConfig.slot1}
              onChange={(v) => updateModelConfig('slot1', v)}
              provider="deepseek"
            />
            <ModelSelector
              label="Advisor Slot 2 (Strategic)"
              value={settings.modelConfig.slot2}
              onChange={(v) => updateModelConfig('slot2', v)}
              provider="xai"
            />
            <div className="py-3 px-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400">
                <span className="font-medium">Slot 3:</span> OpenRouter (FIXED - cannot be changed)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <span className="font-medium">Slot 4:</span> Redactor = Mother Base (auto-aligned)
              </p>
            </div>
          </div>
        </section>

        {/* Consensus Settings */}
        <section className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-base font-semibold text-white mb-2">
            Consensus Settings
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Configure how the multi-AI consensus engine operates.
          </p>
          <div className="space-y-2">
            <RangeInput
              label="Maximum Rounds"
              value={settings.consensus.maxRounds}
              min={1}
              max={5}
              onChange={(v) => updateConsensus('maxRounds', v)}
              description="Number of consensus rounds before finalizing (1-5)"
            />
            <RangeInput
              label="Timeout per Request"
              value={settings.consensus.timeoutSeconds}
              min={10}
              max={60}
              suffix="s"
              onChange={(v) => updateConsensus('timeoutSeconds', v)}
              description="Maximum time to wait for each AI response (10-60 seconds)"
            />
            <RangeInput
              label="Auto-approve Threshold"
              value={settings.consensus.autoApproveThreshold}
              min={50}
              max={100}
              suffix="%"
              onChange={(v) => updateConsensus('autoApproveThreshold', v)}
              description="Minimum consensus percentage for auto-approval (50-100%)"
            />
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-base font-semibold text-white mb-2">
            Appearance
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Customize the look and feel of the interface.
          </p>
          <div className="space-y-2">
            <ToggleSwitch
              label="Compact View"
              checked={settings.appearance.compactView}
              onChange={(v) => updateAppearance('compactView', v)}
              description="Reduce spacing and padding for more content on screen"
            />
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-white text-black text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
                Saving...
              </>
            ) : (
              'Save All Settings'
            )}
          </button>
          {saveSuccess && (
            <span className="text-white flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
