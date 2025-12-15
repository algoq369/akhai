'use client';

import { useState } from 'react';

interface ReasoningStep {
  timestamp: number;
  phase: string;
  message: string;
  data?: any;
}

interface ReasoningLogProps {
  steps: ReasoningStep[];
  currentPhase?: string;
}

export function ReasoningLog({ steps, currentPhase }: ReasoningLogProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px]">🧠</span>
          <span className="text-[12px] font-semibold text-gray-700">
            Reasoning Process
          </span>
          {currentPhase && (
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {currentPhase}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{steps.length} steps</span>
          <span className="text-gray-400 text-[12px]">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Reasoning Steps */}
      {isExpanded && (
        <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-3 text-[11px] pb-2 border-b border-gray-100 last:border-0"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1 ${
                    index === steps.length - 1 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  {index < steps.length - 1 && (
                    <div className="w-px h-full bg-gray-200 mt-1" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-gray-700">{step.phase}</span>
                    <span className="text-[9px] text-gray-400">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{step.message}</p>

                  {/* Optional data display */}
                  {step.data && (
                    <div className="mt-2 bg-white border border-gray-200 rounded p-2">
                      {typeof step.data === 'string' ? (
                        <p className="text-[10px] text-gray-500 font-mono">{step.data}</p>
                      ) : step.data.response ? (
                        <div>
                          <div className="text-[9px] text-gray-400 mb-1">
                            {step.data.family} (Slot {step.data.slot})
                          </div>
                          <p className="text-[10px] text-gray-600 line-clamp-3">
                            {step.data.response}
                          </p>
                        </div>
                      ) : (
                        <pre className="text-[9px] text-gray-500 overflow-x-auto">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      {!isExpanded && (
        <div className="px-4 pb-3 border-t border-gray-200">
          <div className="text-[10px] text-gray-500">
            Last: {steps[steps.length - 1]?.phase} - {steps[steps.length - 1]?.message}
          </div>
        </div>
      )}
    </div>
  );
}
