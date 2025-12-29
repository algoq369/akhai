'use client';

import { useState, useEffect } from 'react';

interface Provider {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
}

interface AdvisorResponse {
  provider: string;
  name: string;
  role: string;
  content: string;
  keyPoints: string[];
  confidence: number;
  latency: number;
  status: 'complete' | 'failed' | 'timeout' | 'thinking';
  error?: string;
}

interface RoundResult {
  round: number;
  responses: AdvisorResponse[];
  consensusLevel: number;
  timestamp: number;
}

interface GTPConsensusViewProps {
  providers: Provider[];
  rounds: RoundResult[];
  currentRound: number;
  isProcessing: boolean;
  finalConsensus?: number;
}

export function GTPConsensusView({
  providers,
  rounds,
  currentRound,
  isProcessing,
  finalConsensus,
}: GTPConsensusViewProps) {
  const [expandedAdvisor, setExpandedAdvisor] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return '✓';
      case 'thinking': return '⟳';
      case 'failed': return '✗';
      case 'timeout': return '⏱';
      default: return '○';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-500';
      case 'thinking': return 'text-blue-500 animate-pulse';
      case 'failed': return 'text-red-500';
      case 'timeout': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };


  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-lg">◯</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">GTP Methodology</h3>
            <p className="text-slate-400 text-xs">
              {isProcessing ? `Round ${currentRound} • Multi-AI Consensus` : `${rounds.length} round(s) • Consensus complete`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-xs">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
          </div>
          {finalConsensus !== undefined && (
            <div className="text-emerald-400 text-sm font-medium">
              {Math.round(finalConsensus * 100)}% consensus
            </div>
          )}
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-3 gap-3">
        {providers.map((provider) => {
          const lastRound = rounds[rounds.length - 1];
          const response = lastRound?.responses.find(r => r.provider === provider.id);
          const status = response?.status || (isProcessing ? 'thinking' : 'waiting');
          
          return (
            <div
              key={provider.id}
              className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
                expandedAdvisor === provider.id
                  ? 'border-white/30 bg-white/10'
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }`}
              onClick={() => setExpandedAdvisor(
                expandedAdvisor === provider.id ? null : provider.id
              )}
            >
              {/* Status indicator */}
              <div className={`absolute top-2 right-2 ${getStatusColor(status)}`}>
                {status === 'thinking' ? (
                  <span className="animate-spin inline-block">⟳</span>
                ) : (
                  getStatusIcon(status)
                )}
              </div>
              
              {/* Provider info */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{provider.icon}</span>
                <div>
                  <div className="text-white text-sm font-medium">{provider.name}</div>
                  <div className="text-slate-400 text-xs">{provider.role}</div>
                </div>
              </div>
              
              {/* Confidence bar */}
              {response?.status === 'complete' && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Confidence</span>
                    <span className="text-white">{Math.round(response.confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${response.confidence * 100}%`,
                        backgroundColor: provider.color,
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Latency */}
              {response?.latency && (
                <div className="text-slate-500 text-xs mt-2">
                  {(response.latency / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Expanded Advisor View */}
      {expandedAdvisor && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
          {(() => {
            const lastRound = rounds[rounds.length - 1];
            const response = lastRound?.responses.find(r => r.provider === expandedAdvisor);
            const provider = providers.find(p => p.id === expandedAdvisor);
            
            if (!response || !provider) return null;
            
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{provider.icon}</span>
                  <span className="text-white font-medium">{provider.name}</span>
                  <span className="text-slate-400 text-sm">({provider.role})</span>
                </div>
                
                {response.keyPoints.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-slate-400 text-xs uppercase tracking-wide">Key Points</div>
                    <ul className="space-y-1">
                      {response.keyPoints.map((point, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-slate-500">•</span>
                          {point.length > 80 ? point.slice(0, 80) + '...' : point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {response.error && (
                  <div className="text-red-400 text-sm bg-red-500/10 rounded p-2">
                    Error: {response.error}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Round History Timeline */}
      {rounds.length > 0 && (
        <div className="border-t border-slate-700 pt-4">
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-3">Round History</div>
          <div className="flex items-center gap-2">
            {rounds.map((round, index) => (
              <div key={round.round} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === rounds.length - 1
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {round.round}
                </div>
                {index < rounds.length - 1 && (
                  <div className="w-8 h-0.5 bg-slate-600" />
                )}
              </div>
            ))}
            {isProcessing && (
              <>
                <div className="w-8 h-0.5 bg-slate-600" />
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="animate-pulse text-blue-400">...</span>
                </div>
              </>
            )}
          </div>
          
          {/* Consensus progression */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-slate-400 text-xs">Consensus:</span>
            {rounds.map((round, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`text-xs ${
                  round.consensusLevel >= 0.85 ? 'text-emerald-400' :
                  round.consensusLevel >= 0.6 ? 'text-yellow-400' :
                  'text-slate-400'
                }`}>
                  R{round.round}: {Math.round(round.consensusLevel * 100)}%
                </span>
                {i < rounds.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-slate-500 text-xs">
        ◯ GTP • Parallel multi-AI consensus via DeepSeek + Mistral + Grok
      </div>
    </div>
  );
}
