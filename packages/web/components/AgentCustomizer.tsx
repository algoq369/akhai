'use client';

import { useState } from 'react';
import { AgentConfig } from '@/lib/agent-config';
import RobotIntelligence from './RobotIntelligence';
import {
  FUNCTION_CATEGORIES,
  WALKING_STYLES,
} from './AgentCustomizer.constants';
import { AIBehaviorSection, PersonalitySection } from './AgentCustomizer.sections';

interface AgentCustomizerProps {
  agentId: string | null;
  onAgentSelect: (id: string | null) => void;
}

export default function AgentCustomizer({ agentId, onAgentSelect }: AgentCustomizerProps) {
  const [config, setConfig] = useState<Partial<AgentConfig>>({
    name: '',
    type: 'handball',
    physical: {
      walkingSpeed: 1,
      walkingStyle: 'normal',
      strength: 1,
      endurance: 1,
      scale: 0.1,
    },
    vision: {
      fieldOfView: 120,
      focusDistance: 'adaptive',
      colorPerception: 'full color',
      nightVision: false,
      recognitionSensitivity: 0.5,
    },
    functions: {
      categories: [],
      priorities: {},
    },
    ai: {
      creativity: 0.5,
      intuition: 0.5,
      learningSpeed: 0.5,
      adaptability: 0.5,
    },
    personality: {
      communicationStyle: 'friendly',
      proactivity: 0.5,
      curiosity: 0.5,
    },
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('agent');

  const handleSave = async () => {
    try {
      const res = await fetch('/api/idea-factory/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          functions: { ...config.functions, categories: selectedCategories },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAgentSelect(data.id);
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  return (
    <div className="space-y-8">
      {/* Section Navigation */}
      <div className="flex gap-2 border-b border-relic-mist pb-2">
        {[
          { id: 'agent', name: 'Agent Type' },
          { id: 'physical', name: 'Physical' },
          { id: 'vision', name: 'Vision' },
          { id: 'functions', name: 'Functions' },
          { id: 'ai', name: 'AI Behavior' },
          { id: 'personality', name: 'Personality' },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              activeSection === section.id
                ? 'bg-relic-slate text-relic-white'
                : 'text-relic-silver hover:text-relic-slate'
            }`}
          >
            {section.name}
          </button>
        ))}
      </div>

      {/* Agent Selection */}
      {activeSection === 'agent' && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-mono text-relic-slate mb-4">Agent Selection</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                id: 'mini-akhai',
                name: 'Mini AkhAI',
                description: 'Compact AI companion for everyday tasks',
                icon: '◇',
                size: 'Handball-sized',
              },
              {
                id: 'akhai',
                name: 'AkhAI',
                description: 'Full-scale AI agent with advanced capabilities',
                icon: '◊',
                size: 'Human-sized',
              },
              {
                id: 'custom',
                name: 'Custom',
                description: 'Build your own agent from scratch',
                icon: '⚙',
                size: 'Configurable',
              },
            ].map((agent) => (
              <button
                key={agent.id}
                onClick={() => setConfig((prev) => ({ ...prev, type: agent.id as any }))}
                className={`
                  p-6 border-2 transition-all duration-200 flex flex-col items-center
                  ${
                    config.type === agent.id
                      ? 'border-relic-slate bg-relic-ghost shadow-md'
                      : 'border-relic-mist hover:border-relic-silver hover:bg-relic-ghost/50'
                  }
                `}
              >
                <div className="text-4xl text-relic-slate mb-3">{agent.icon}</div>
                <div className="text-sm font-mono text-relic-slate mb-1">{agent.name}</div>
                <div className="text-[9px] text-relic-silver text-center mb-2">
                  {agent.description}
                </div>
                <div className="text-[8px] text-relic-silver bg-relic-ghost px-2 py-0.5">
                  {agent.size}
                </div>
              </button>
            ))}
          </div>

          {/* Agent Name */}
          <div>
            <label className="text-xs text-relic-silver mb-2 block">Agent Name</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter agent name..."
              className="w-full px-4 py-2 border border-relic-mist bg-relic-white text-relic-slate text-sm font-mono focus:outline-none focus:border-relic-slate"
            />
          </div>

          {/* Robot Visualization */}
          {config.type && (
            <div className="mt-8">
              <h3 className="text-sm font-mono text-relic-slate mb-4">AI Component Architecture</h3>
              <div className="h-[600px] border border-relic-mist rounded-lg overflow-hidden bg-white">
                <RobotIntelligence
                  initialScale={
                    config.type === 'handball'
                      ? 'handball'
                      : config.type === 'human'
                        ? 'human'
                        : config.type === 'custom'
                          ? 'human'
                          : 'human'
                  }
                  embedded={true}
                  showToggle={config.type === 'custom'}
                  theme="light"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Physical Capabilities */}
      {activeSection === 'physical' && (
        <div className="animate-fade-in space-y-6">
          <h2 className="text-lg font-mono text-relic-slate mb-4">Physical Capabilities</h2>

          {/* Walking Speed */}
          <div>
            <label className="text-xs text-relic-silver mb-2 block">Walking Speed</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={config.physical?.walkingSpeed || 1}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  physical: { ...prev.physical!, walkingSpeed: parseFloat(e.target.value) },
                }))
              }
              className="w-full accent-relic-slate"
            />
            <div className="flex justify-between text-[10px] text-relic-silver">
              <span>Slow (0.1x)</span>
              <span className="font-mono text-relic-slate">{config.physical?.walkingSpeed}x</span>
              <span>Fast (5x)</span>
            </div>
          </div>

          {/* Walking Style */}
          <div>
            <label className="text-xs text-relic-silver mb-2 block">Walking Style</label>
            <div className="grid grid-cols-2 gap-2">
              {WALKING_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      physical: { ...prev.physical!, walkingStyle: style.id as any },
                    }))
                  }
                  className={`p-3 border text-left transition-colors ${
                    config.physical?.walkingStyle === style.id
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

          {/* Strength */}
          <div>
            <label className="text-xs text-relic-silver mb-2 block">Strength Level</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={config.physical?.strength || 1}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  physical: { ...prev.physical!, strength: parseFloat(e.target.value) },
                }))
              }
              className="w-full accent-relic-slate"
            />
            <div className="flex justify-between text-[10px] text-relic-silver">
              <span>Light</span>
              <span className="font-mono text-relic-slate">{config.physical?.strength} units</span>
              <span>Heavy</span>
            </div>
          </div>

          {/* Endurance */}
          <div>
            <label className="text-xs text-relic-silver mb-2 block">
              Endurance (Battery/Energy)
            </label>
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={config.physical?.endurance || 8}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  physical: { ...prev.physical!, endurance: parseFloat(e.target.value) },
                }))
              }
              className="w-full accent-relic-slate"
            />
            <div className="flex justify-between text-[10px] text-relic-silver">
              <span>1 hour</span>
              <span className="font-mono text-relic-slate">
                {config.physical?.endurance || 8} hours
              </span>
              <span>24 hours</span>
            </div>
          </div>
        </div>
      )}

      {/* Vision Function */}
      {activeSection === 'vision' && (
        <div className="animate-fade-in space-y-6">
          <h2 className="text-lg font-mono text-relic-slate mb-4">Vision Function</h2>

          {/* Field of View */}
          <div>
            <label className="text-xs text-relic-silver mb-2 block">Field of View</label>
            <input
              type="range"
              min="60"
              max="360"
              step="10"
              value={config.vision?.fieldOfView || 120}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  vision: { ...prev.vision!, fieldOfView: parseInt(e.target.value) },
                }))
              }
              className="w-full accent-relic-slate"
            />
            <div className="flex justify-between text-[10px] text-relic-silver">
              <span>Narrow (60°)</span>
              <span className="font-mono text-relic-slate">{config.vision?.fieldOfView}°</span>
              <span>Full (360°)</span>
            </div>
          </div>

          {/* Recognition Sensitivity */}
          <div>
            <label className="text-xs text-relic-silver mb-2 block">
              Object Recognition Sensitivity
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.vision?.recognitionSensitivity || 0.5}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  vision: { ...prev.vision!, recognitionSensitivity: parseFloat(e.target.value) },
                }))
              }
              className="w-full accent-relic-slate"
            />
            <div className="flex justify-between text-[10px] text-relic-silver">
              <span>Low</span>
              <span className="font-mono text-relic-slate">
                {Math.round((config.vision?.recognitionSensitivity || 0.5) * 100)}%
              </span>
              <span>High</span>
            </div>
          </div>

          {/* Vision Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Night Vision */}
            <label className="flex items-center gap-3 p-3 border border-relic-mist cursor-pointer hover:bg-relic-ghost/50">
              <input
                type="checkbox"
                checked={config.vision?.nightVision || false}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    vision: { ...prev.vision!, nightVision: e.target.checked },
                  }))
                }
                className="accent-relic-slate"
              />
              <div>
                <div className="text-xs font-mono text-relic-slate">Night Vision</div>
                <div className="text-[9px] text-relic-silver">Enable low-light operation</div>
              </div>
            </label>

            {/* Depth Perception */}
            <label className="flex items-center gap-3 p-3 border border-relic-mist cursor-pointer hover:bg-relic-ghost/50">
              <input type="checkbox" checked={true} className="accent-relic-slate" disabled />
              <div>
                <div className="text-xs font-mono text-relic-slate">Depth Perception</div>
                <div className="text-[9px] text-relic-silver">3D spatial awareness</div>
              </div>
            </label>

            {/* Face Recognition */}
            <label className="flex items-center gap-3 p-3 border border-relic-mist cursor-pointer hover:bg-relic-ghost/50">
              <input type="checkbox" defaultChecked={true} className="accent-relic-slate" />
              <div>
                <div className="text-xs font-mono text-relic-slate">Face Recognition</div>
                <div className="text-[9px] text-relic-silver">Identify known individuals</div>
              </div>
            </label>

            {/* Object Tracking */}
            <label className="flex items-center gap-3 p-3 border border-relic-mist cursor-pointer hover:bg-relic-ghost/50">
              <input type="checkbox" defaultChecked={true} className="accent-relic-slate" />
              <div>
                <div className="text-xs font-mono text-relic-slate">Object Tracking</div>
                <div className="text-[9px] text-relic-silver">Follow moving objects</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Functions */}
      {activeSection === 'functions' && (
        <div className="animate-fade-in space-y-6">
          <h2 className="text-lg font-mono text-relic-slate mb-4">Everyday Functions</h2>
          <p className="text-xs text-relic-silver mb-4">
            Select the function categories your agent should prioritize
          </p>

          <div className="grid grid-cols-2 gap-4">
            {FUNCTION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`p-4 border text-left transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'border-relic-slate bg-relic-ghost shadow-md'
                    : 'border-relic-mist hover:border-relic-silver'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-sm font-mono text-relic-slate">{category.name}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {category.tasks.map((task) => (
                    <span
                      key={task}
                      className="text-[8px] text-relic-silver bg-relic-ghost/50 px-1.5 py-0.5"
                    >
                      {task}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Behavior */}
      {activeSection === 'ai' && (
        <AIBehaviorSection config={config} setConfig={setConfig} />
      )}

      {/* Personality */}
      {activeSection === 'personality' && (
        <PersonalitySection config={config} setConfig={setConfig} />
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4 pt-4 border-t border-relic-mist">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-relic-slate text-relic-white text-xs font-mono hover:bg-relic-void transition-colors"
        >
          Save Agent Configuration
        </button>
        <span className="text-[10px] text-relic-silver">
          {selectedCategories.length} function categories selected
        </span>
      </div>
    </div>
  );
}
