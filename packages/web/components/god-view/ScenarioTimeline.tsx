'use client';

import type { ScenarioBranch } from '@/lib/god-view/scenario-engine';

interface ScenarioTimelineProps {
  branches: ScenarioBranch[];
  onSelect: (id: string) => void;
  isLoading: boolean;
}

const BRANCH_CONFIG: Record<string, { angle: number; sigil: string; label: string }> = {
  optimistic: { angle: -35, sigil: '◇', label: 'OPTIMISTIC' },
  balanced: { angle: 0, sigil: '◎', label: 'BALANCED' },
  pessimistic: { angle: 35, sigil: '◉', label: 'PESSIMISTIC' },
};

export default function ScenarioTimeline({ branches, onSelect, isLoading }: ScenarioTimelineProps) {
  const cx = 300;
  const splitY = 100;
  const endY = 260;
  const spread = 160;

  const branchEndpoints: Record<string, { x: number; y: number }> = {
    optimistic: { x: cx - spread, y: endY },
    balanced: { x: cx, y: endY },
    pessimistic: { x: cx + spread, y: endY },
  };

  const branchMap = new Map(branches.map((b) => [b.id, b]));

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox="0 0 600 300"
        className="w-full max-w-[600px]"
        role="img"
        aria-label="Scenario timeline"
      >
        {/* Trunk line */}
        <line
          x1={cx}
          y1={20}
          x2={cx}
          y2={splitY}
          stroke="currentColor"
          strokeWidth={2}
          className={`text-zinc-400 ${isLoading ? 'animate-pulse' : ''}`}
        />

        {/* Seed point */}
        <circle cx={cx} cy={20} r={4} className="fill-zinc-500" />
        <text x={cx} y={12} textAnchor="middle" className="fill-zinc-500 text-[9px] font-mono">
          SEED
        </text>

        {/* Split point */}
        <circle cx={cx} cy={splitY} r={5} className="fill-zinc-600" />
        <text
          x={cx}
          y={splitY - 12}
          textAnchor="middle"
          className="fill-zinc-500 text-[9px] font-mono"
        >
          WHAT IF?
        </text>

        {/* Branch lines */}
        {!isLoading &&
          (['optimistic', 'balanced', 'pessimistic'] as const).map((id) => {
            const end = branchEndpoints[id];
            const branch = branchMap.get(id);
            const confidence = branch?.confidence ?? 50;
            const strokeW = Math.max(1.5, (confidence / 100) * 4);
            const config = BRANCH_CONFIG[id];
            const pathId = `branch-${id}`;

            return (
              <g
                key={id}
                onClick={() => onSelect(id)}
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelect(id);
                }}
              >
                {/* Branch path */}
                <path
                  id={pathId}
                  d={`M ${cx} ${splitY} Q ${(cx + end.x) / 2} ${(splitY + end.y) / 2 - 10} ${end.x} ${end.y}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeW}
                  className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
                  strokeDasharray="300"
                  strokeDashoffset="0"
                  style={{
                    animation: `branchGrow 0.8s ease-out ${id === 'optimistic' ? '0s' : id === 'balanced' ? '0.2s' : '0.4s'} both`,
                  }}
                />

                {/* Endpoint node */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={8}
                  className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-500 group-hover:stroke-zinc-700 dark:group-hover:stroke-zinc-300 transition-colors"
                  strokeWidth={1.5}
                />

                {/* Sigil */}
                <text
                  x={end.x}
                  y={end.y + 3.5}
                  textAnchor="middle"
                  className="fill-zinc-600 dark:fill-zinc-300 text-[10px]"
                >
                  {config.sigil}
                </text>

                {/* Label */}
                <text
                  x={end.x}
                  y={end.y + 24}
                  textAnchor="middle"
                  className="fill-zinc-500 dark:fill-zinc-400 text-[8px] font-mono tracking-wider"
                >
                  {config.label}
                </text>

                {/* Title + confidence */}
                {branch && (
                  <text
                    x={end.x}
                    y={end.y + 36}
                    textAnchor="middle"
                    className="fill-zinc-400 dark:fill-zinc-500 text-[7px] font-mono"
                  >
                    {branch.title.slice(0, 25)} · {confidence}%
                  </text>
                )}
              </g>
            );
          })}

        {/* Loading placeholder branches */}
        {isLoading &&
          (['optimistic', 'balanced', 'pessimistic'] as const).map((id) => {
            const end = branchEndpoints[id];
            return (
              <line
                key={id}
                x1={cx}
                y1={splitY}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="4 4"
                className="text-zinc-300 dark:text-zinc-700 animate-pulse"
              />
            );
          })}

        {/* CSS animation */}
        <style>{`
          @keyframes branchGrow {
            from { stroke-dashoffset: 300; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
}
