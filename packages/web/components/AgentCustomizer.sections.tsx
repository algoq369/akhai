'use client';

import { AgentConfig } from '@/lib/agent-config';
import { COMMUNICATION_STYLES } from './AgentCustomizer.constants';

interface SectionProps {
  config: Partial<AgentConfig>;
  setConfig: React.Dispatch<React.SetStateAction<Partial<AgentConfig>>>;
}

/**
 * AI Behavior section for AgentCustomizer
 */
export function AIBehaviorSection({ config, setConfig }: SectionProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-lg font-mono text-relic-slate mb-4">AI Behavior</h2>

      {[
        {
          key: 'creativity',
          name: 'Creativity',
          desc: 'How inventive the AI is in problem-solving',
        },
        {
          key: 'intuition',
          name: 'Intuition',
          desc: 'Ability to make decisions with incomplete information',
        },
        {
          key: 'learningSpeed',
          name: 'Learning Speed',
          desc: 'How quickly the AI adapts to new situations',
        },
        {
          key: 'adaptability',
          name: 'Adaptability',
          desc: 'Flexibility in changing environments',
        },
      ].map((attr) => (
        <div key={attr.key}>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-relic-silver">{attr.name}</label>
            <span className="text-[10px] text-relic-silver">{attr.desc}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={(config.ai as any)?.[attr.key] || 0.5}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                ai: { ...prev.ai!, [attr.key]: parseFloat(e.target.value) },
              }))
            }
            className="w-full accent-relic-slate"
          />
          <div className="flex justify-between text-[10px] text-relic-silver mt-1">
            <span>Low</span>
            <span className="font-mono text-relic-slate">
              {Math.round(((config.ai as any)?.[attr.key] || 0.5) * 100)}%
            </span>
            <span>High</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Personality section for AgentCustomizer
 */
export function PersonalitySection({ config, setConfig }: SectionProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-lg font-mono text-relic-slate mb-4">Personality & Communication</h2>

      {/* Communication Style */}
      <div>
        <label className="text-xs text-relic-silver mb-2 block">Communication Style</label>
        <div className="grid grid-cols-2 gap-2">
          {COMMUNICATION_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  personality: { ...prev.personality!, communicationStyle: style.id as any },
                }))
              }
              className={`p-3 border text-left transition-colors ${
                config.personality?.communicationStyle === style.id
                  ? 'border-relic-slate bg-relic-ghost'
                  : 'border-relic-mist hover:border-relic-silver'
              }`}
            >
              <div className="text-xs font-mono text-relic-slate">{style.name}</div>
              <div className="text-[9px] text-relic-silver">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Proactivity */}
      <div>
        <label className="text-xs text-relic-silver mb-2 block">Proactivity Level</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.personality?.proactivity || 0.5}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              personality: { ...prev.personality!, proactivity: parseFloat(e.target.value) },
            }))
          }
          className="w-full accent-relic-slate"
        />
        <div className="flex justify-between text-[10px] text-relic-silver">
          <span>Reactive (waits for commands)</span>
          <span className="font-mono text-relic-slate">
            {Math.round((config.personality?.proactivity || 0.5) * 100)}%
          </span>
          <span>Proactive (suggests actions)</span>
        </div>
      </div>

      {/* Curiosity */}
      <div>
        <label className="text-xs text-relic-silver mb-2 block">Curiosity Level</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.personality?.curiosity || 0.5}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              personality: { ...prev.personality!, curiosity: parseFloat(e.target.value) },
            }))
          }
          className="w-full accent-relic-slate"
        />
        <div className="flex justify-between text-[10px] text-relic-silver">
          <span>Focused (task-oriented)</span>
          <span className="font-mono text-relic-slate">
            {Math.round((config.personality?.curiosity || 0.5) * 100)}%
          </span>
          <span>Curious (explores environment)</span>
        </div>
      </div>
    </div>
  );
}
