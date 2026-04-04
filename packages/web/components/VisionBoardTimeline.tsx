'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BoardNode, BoardNodeType, NODE_COLORS } from './VisionBoardTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelinePin {
  date: string;
  label: string;
}

interface VisionBoardTimelineProps {
  nodes: BoardNode[];
  userId: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VisionBoardTimeline({ nodes, userId }: VisionBoardTimelineProps) {
  const PINS_KEY = userId ? `akhai-vision-pins-${userId}` : 'akhai-vision-pins-none';
  const [timelinePins, setTimelinePins] = useState<TimelinePin[]>(() => {
    if (typeof window === 'undefined' || !userId) return [];
    try {
      const raw = localStorage.getItem(PINS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const pinsInitRef = useRef(false);
  const [hoveredPin, setHoveredPin] = useState<{ label: string; x: number; y: number } | null>(
    null
  );
  const [pinPopup, setPinPopup] = useState<{ date: string; displayDate: string; x: number } | null>(
    null
  );
  const [pinLabel, setPinLabel] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinsInitRef.current) {
      pinsInitRef.current = true;
      return;
    }
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(timelinePins));
    } catch {}
  }, [timelinePins]);

  const calendarData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let minDate: Date;
    if (nodes.length > 0) {
      const earliest = Math.min(...nodes.map((n) => n.createdAt));
      minDate = new Date(earliest);
      minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    } else {
      minDate = new Date(today.getTime() - 30 * 86400000);
    }
    const maxDate = new Date(today.getTime() + 30 * 86400000);
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000));

    const activityMap = new Map<string, { count: number; types: Record<string, number> }>();
    nodes.forEach((n) => {
      const d = new Date(n.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = activityMap.get(key) || { count: 0, types: {} };
      entry.count++;
      entry.types[n.type] = (entry.types[n.type] || 0) + 1;
      activityMap.set(key, entry);
    });
    const maxActivity = Math.max(1, ...Array.from(activityMap.values()).map((v) => v.count));

    const months: { label: string; x: number }[] = [];
    let lastMonth = -1;
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(minDate.getTime() + i * 86400000);
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        months.push({
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          x: (i / totalDays) * 100,
        });
      }
    }

    const todayPos = ((today.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100;

    return { minDate, maxDate, totalDays, activityMap, maxActivity, months, todayPos, today };
  }, [nodes]);

  return (
    <div
      className="flex-none bg-[#f8fafc] select-none"
      style={{ height: 80, borderTop: '1px solid #e2e8f0' }}
    >
      <div className="flex h-full">
        <div className="flex-shrink-0 flex flex-col justify-center px-3" style={{ width: 70 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#94a3b8',
              letterSpacing: '0.05em',
            }}
          >
            TIMELINE
          </span>
          <span style={{ fontSize: 8, color: '#cbd5e1', marginTop: 2 }}>{nodes.length} nodes</span>
        </div>
        <div
          ref={timelineRef}
          className="flex-1 relative cursor-crosshair"
          onClick={(e) => {
            const rect = timelineRef.current?.getBoundingClientRect();
            if (!rect) return;
            const pct = (e.clientX - rect.left) / rect.width;
            const dayIdx = Math.floor(pct * calendarData.totalDays);
            const clickedDate = new Date(calendarData.minDate.getTime() + dayIdx * 86400000);
            const dateStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(clickedDate.getDate()).padStart(2, '0')}`;
            const existing = timelinePins.find((p) => p.date === dateStr);
            if (existing) {
              setTimelinePins((prev) => prev.filter((p) => p.date !== dateStr));
              return;
            }
            setPinPopup({
              date: dateStr,
              displayDate: clickedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              x: e.clientX - rect.left,
            });
            setPinLabel('');
          }}
        >
          {/* Month labels */}
          <div className="absolute top-0 left-0 right-0" style={{ height: 16 }}>
            {calendarData.months.map((m, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  left: `${m.x}%`,
                  fontSize: 8,
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Activity bars + pins */}
          <div className="absolute left-0 right-0" style={{ top: 18, height: 40 }}>
            <svg className="w-full h-full" preserveAspectRatio="none">
              {Array.from({ length: Math.ceil(calendarData.totalDays / 5) }, (_, i) => {
                const x = ((i * 5) / calendarData.totalDays) * 100;
                return (
                  <line
                    key={i}
                    x1={`${x}%`}
                    y1="0"
                    x2={`${x}%`}
                    y2="100%"
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                  />
                );
              })}

              {Array.from(calendarData.activityMap.entries()).map(([dateKey, activity]) => {
                const [y, m, d] = dateKey.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                const dayIdx = Math.floor(
                  (date.getTime() - calendarData.minDate.getTime()) / 86400000
                );
                const x = (dayIdx / calendarData.totalDays) * 100;
                const barH = (activity.count / calendarData.maxActivity) * 36;
                const topType = Object.entries(activity.types).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] as BoardNodeType | undefined;
                const color = topType ? NODE_COLORS[topType]?.border || '#94a3b8' : '#94a3b8';
                const barW = Math.max(100 / calendarData.totalDays - 0.2, 0.3);
                return (
                  <rect
                    key={dateKey}
                    x={`${x}%`}
                    y={40 - barH}
                    width={`${barW}%`}
                    height={barH}
                    rx={1}
                    fill={color}
                    opacity={0.75}
                  />
                );
              })}

              {calendarData.todayPos >= 0 && calendarData.todayPos <= 100 && (
                <line
                  x1={`${calendarData.todayPos}%`}
                  y1="0"
                  x2={`${calendarData.todayPos}%`}
                  y2="100%"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
              )}
            </svg>

            {timelinePins.map((pin, i) => {
              const [y, m, d] = pin.date.split('-').map(Number);
              const pinDate = new Date(y, m - 1, d);
              const dayIdx = Math.floor(
                (pinDate.getTime() - calendarData.minDate.getTime()) / 86400000
              );
              const x = (dayIdx / calendarData.totalDays) * 100;
              if (x < 0 || x > 100) return null;
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: `${x}%`, top: 0, transform: 'translateX(-50%)' }}
                  onMouseEnter={(e) =>
                    setHoveredPin({ label: pin.label, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setHoveredPin(null)}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <polygon points="5,0 10,5 5,10 0,5" fill="#8b5cf6" />
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Day numbers */}
          <div className="absolute left-0 right-0 bottom-0" style={{ height: 18 }}>
            {Array.from({ length: Math.ceil(calendarData.totalDays / 5) }, (_, i) => {
              const dayIdx = i * 5;
              const d = new Date(calendarData.minDate.getTime() + dayIdx * 86400000);
              const x = (dayIdx / calendarData.totalDays) * 100;
              return (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    fontSize: 7,
                    color: '#cbd5e1',
                    transform: 'translateX(-50%)',
                  }}
                >
                  {d.getDate()}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pin hover tooltip */}
      {hoveredPin && (
        <div
          style={{
            position: 'fixed',
            left: hoveredPin.x + 8,
            top: hoveredPin.y - 28,
            zIndex: 50,
            background: '#1e293b',
            color: 'white',
            fontSize: 9,
            padding: '3px 8px',
            borderRadius: 4,
            pointerEvents: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          {hoveredPin.label}
        </div>
      )}

      {/* Inline pin popup */}
      {pinPopup && (
        <div
          style={{
            position: 'absolute',
            left: Math.max(
              10,
              Math.min(pinPopup.x + 70 - 80, (timelineRef.current?.offsetWidth || 400) - 180)
            ),
            bottom: 60,
            zIndex: 50,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>
            pin for {pinPopup.displayDate}
          </div>
          <input
            autoFocus
            value={pinLabel}
            onChange={(e) => setPinLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pinLabel.trim()) {
                setTimelinePins((prev) => [
                  ...prev,
                  { date: pinPopup.date, label: pinLabel.trim() },
                ]);
                setPinPopup(null);
                setPinLabel('');
              }
              if (e.key === 'Escape') setPinPopup(null);
            }}
            style={{
              fontSize: 10,
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              padding: '3px 6px',
              width: 140,
              outline: 'none',
            }}
            placeholder="label..."
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <button
              onClick={() => setPinPopup(null)}
              style={{
                fontSize: 8,
                padding: '2px 6px',
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                background: 'white',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              cancel
            </button>
            <button
              onClick={() => {
                if (pinLabel.trim())
                  setTimelinePins((prev) => [
                    ...prev,
                    { date: pinPopup.date, label: pinLabel.trim() },
                  ]);
                setPinPopup(null);
                setPinLabel('');
              }}
              style={{
                fontSize: 8,
                padding: '2px 6px',
                border: 'none',
                borderRadius: 3,
                background: '#1e293b',
                cursor: 'pointer',
                color: 'white',
              }}
            >
              add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
