'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CRITICAL_LAYERS, AI_LAYERS, PRESETS } from './WorkbenchConsole.constants';

interface ConfigHistory {
  id: string;
  name: string;
  date: string;
  testCount: number;
}

interface WorkbenchRightPanelProps {
  configHistory: ConfigHistory[];
  activePreset: string;
  isAdvancedOpen: boolean;
  setIsAdvancedOpen: (open: boolean) => void;
  applyPreset: (presetId: string) => void;
  getWeight: (id: number) => number;
  handleWeightChange: (id: number, value: number) => void;
}

export function WorkbenchRightPanel({
  configHistory,
  activePreset,
  isAdvancedOpen,
  setIsAdvancedOpen,
  applyPreset,
  getWeight,
  handleWeightChange,
}: WorkbenchRightPanelProps) {
  return (
    <div className="flex-1 p-4">
      {/* Quick Settings */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-wider text-neutral-400">
            Quick Settings
          </div>
          <div className="text-[9px] text-neutral-300">top 3 impact layers</div>
        </div>

        <div className="space-y-4">
          {CRITICAL_LAYERS.map((layer) => {
            const weight = getWeight(layer.id);
            return (
              <div key={layer.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">★</span>
                    <span className="font-medium text-neutral-700">{layer.name}</span>
                  </div>
                  <span className="text-neutral-700 tabular-nums">{Math.round(weight * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-neutral-400 w-16 text-right">
                    {layer.extremes.low}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(weight * 100)}
                    onChange={(e) => handleWeightChange(layer.id, parseInt(e.target.value) / 100)}
                    className="flex-1 h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                             [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-neutral-700 [&::-webkit-slider-thumb]:border-2
                             [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                    style={{
                      background: `linear-gradient(to right, ${layer.color}60 0%, ${layer.color}60 ${weight * 100}%, #f5f5f5 ${weight * 100}%, #f5f5f5 100%)`,
                    }}
                  />
                  <span className="text-[9px] text-neutral-400 w-16">{layer.extremes.high}</span>
                </div>
                <div className="text-[9px] text-neutral-400 mt-0.5 ml-5">{layer.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Presets</div>
        <div className="flex gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-2.5 py-1 text-[10px] rounded border transition-all ${
                activePreset === preset.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {preset.name}
            </button>
          ))}
          {activePreset === 'custom' && (
            <span className="px-2.5 py-1 text-[10px] text-neutral-400 border border-dashed border-neutral-300 rounded">
              custom
            </span>
          )}
        </div>
      </div>

      {/* Show All Layers Button */}
      <button
        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] text-neutral-500
                 border border-neutral-200 rounded hover:bg-neutral-50 transition-colors mb-6"
      >
        <span className="uppercase tracking-wider">Show All 11 Layers</span>
        <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center">
          {isAdvancedOpen ? '−' : '+'}
        </span>
      </button>

      {/* Advanced: All Layers */}
      <AnimatePresence>
        {isAdvancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="border border-neutral-200 rounded p-3">
              {(['input', 'understanding', 'reasoning', 'output'] as const).map((phase) => {
                const phaseLayers = AI_LAYERS.filter((l) => l.phase === phase);
                return (
                  <div key={phase} className="mb-3 last:mb-0">
                    <div className="text-[8px] uppercase tracking-wider text-neutral-300 mb-1.5">
                      {phase}
                    </div>
                    <div className="space-y-1.5">
                      {phaseLayers.map((layer) => {
                        const weight = getWeight(layer.id);
                        return (
                          <div key={layer.id} className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span
                              className={`text-[10px] w-24 truncate ${layer.critical ? 'font-medium text-neutral-700' : 'text-neutral-500'}`}
                            >
                              {layer.name}
                              {layer.critical && ' ★'}
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={Math.round(weight * 100)}
                              onChange={(e) =>
                                handleWeightChange(layer.id, parseInt(e.target.value) / 100)
                              }
                              className="flex-1 h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer
                                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2
                                       [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full
                                       [&::-webkit-slider-thumb]:bg-neutral-600"
                            />
                            <span className="text-[9px] text-neutral-500 tabular-nums w-8 text-right">
                              {Math.round(weight * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config History */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-wider text-neutral-400">
            Configuration History
          </div>
          <div className="text-[9px] text-neutral-300">{configHistory.length} saved</div>
        </div>
        <div className="space-y-1.5">
          {configHistory.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between px-3 py-2 border border-neutral-200 rounded hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-neutral-700">{config.name}</span>
                <span className="text-neutral-400">{config.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">{config.testCount} tests</span>
                <span className="text-neutral-300">›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
