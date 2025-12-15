'use client';

interface ModelOption {
  value: string;
  label: string;
}

interface ModelSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  provider: 'anthropic' | 'deepseek' | 'xai' | 'openrouter';
  disabled?: boolean;
}

const modelOptions: Record<string, ModelOption[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  ],
  xai: [
    { value: 'grok-3', label: 'Grok 3' },
    { value: 'grok-2-latest', label: 'Grok 2 Latest' },
  ],
  openrouter: [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (via OpenRouter)' },
    { value: 'google/gemini-2.0-flash-thinking-exp:free', label: 'Gemini 2.0 Flash Thinking' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (via OpenRouter)' },
  ],
};

export default function ModelSelector({
  label,
  value,
  onChange,
  provider,
  disabled = false,
}: ModelSelectorProps) {
  const options = modelOptions[provider] || [];

  return (
    <div className="py-3">
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
