'use client';

import { useEffect, useState } from 'react';

interface AdvisorProgress {
  slot: number;
  family: string;
  role: string;
  status: 'waiting' | 'thinking' | 'complete' | 'failed';
  confidence?: number;
  keyPoints?: string[];
}

interface QuorumStatus {
  responsesReceived: number;
  responsesExpected: number;
  agreementLevel: number;
  reached: boolean;
  reason?: string;
}

interface FlashProgressProps {
  advisorCount: number;
  advisors: AdvisorProgress[];
  quorum?: QuorumStatus;
  insightsCount?: number;
}

export function FlashProgress({ advisorCount, advisors, quorum, insightsCount }: FlashProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: AdvisorProgress['status']) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'thinking': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: AdvisorProgress['status']) => {
    switch (status) {
      case 'complete': return '✓';
      case 'thinking': return '⟳';
      case 'failed': return '✗';
      default: return '○';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'technical': return '🔧';
      case 'strategic': return '📊';
      case 'creative': return '💡';
      case 'critical': return '⚠️';
      default: return '🤖';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">◯</span>
          <span className="text-[12px] font-semibold text-gray-700">GTP - Multi-AI Parallel Execution</span>
        </div>
        <div className="text-[10px] text-gray-500">
          {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Advisor Progress Bars */}
      <div className="space-y-2">
        {advisors.map((advisor) => (
          <div key={advisor.slot} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px]">{getRoleIcon(advisor.role)}</span>
                <span className="text-[11px] text-gray-600">
                  Slot {advisor.slot} · {advisor.role}
                </span>
                <span className="text-[10px] text-gray-400">({advisor.family})</span>
              </div>
              <div className="flex items-center gap-2">
                {advisor.status === 'complete' && advisor.confidence !== undefined && (
                  <span className="text-[10px] text-gray-500">
                    {Math.round(advisor.confidence * 100)}% confidence
                  </span>
                )}
                <span className={`text-[11px] ${
                  advisor.status === 'complete' ? 'text-green-600' :
                  advisor.status === 'failed' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {getStatusIcon(advisor.status)}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${getStatusColor(advisor.status)}`}
                style={{
                  width: advisor.status === 'complete' ? '100%' :
                         advisor.status === 'thinking' ? '50%' :
                         advisor.status === 'failed' ? '100%' : '0%'
                }}
              />
            </div>
            {advisor.keyPoints && advisor.keyPoints.length > 0 && (
              <div className="ml-6 mt-1">
                <div className="text-[9px] text-gray-500">
                  {advisor.keyPoints[0].substring(0, 60)}...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quorum Status */}
      {quorum && (
        <div className="border-t border-blue-200 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-gray-700">Consensus Status</span>
              {quorum.reached && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Quorum Reached
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-600">
              {quorum.responsesReceived}/{quorum.responsesExpected} responses
            </div>
          </div>

          {/* Agreement Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Agreement Level</span>
              <span className="text-[10px] font-medium text-gray-700">
                {Math.round(quorum.agreementLevel * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  quorum.agreementLevel >= 0.85 ? 'bg-green-500' :
                  quorum.agreementLevel >= 0.6 ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${quorum.agreementLevel * 100}%` }}
              />
            </div>
          </div>

          {quorum.reason && (
            <div className="text-[9px] text-gray-500">
              Reason: {quorum.reason === 'high_agreement' ? 'High agreement (85%+)' :
                       quorum.reason === 'min_responses' ? 'Minimum responses met' :
                       quorum.reason === 'all_complete' ? 'All advisors complete' :
                       quorum.reason === 'timeout' ? 'Timeout reached' : quorum.reason}
            </div>
          )}
        </div>
      )}

      {/* Insights Summary */}
      {insightsCount !== undefined && insightsCount > 0 && (
        <div className="border-t border-blue-200 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">
              ✨ {insightsCount} unique insights merged
            </span>
          </div>
        </div>
      )}

      {/* Performance Note */}
      <div className="text-[9px] text-gray-400 text-center">
        ◯ GTP Methodology • 3x faster via parallel AI execution
      </div>
    </div>
  );
}
