'use client';

import React, { useState, useCallback } from 'react';
import { Objective } from './VisionBoardTypes';
import { genId } from './VisionBoardState';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VisionBoardObjectivesProps {
  objectives: Objective[];
  setObjectives: React.Dispatch<React.SetStateAction<Objective[]>>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VisionBoardObjectives({
  objectives,
  setObjectives,
}: VisionBoardObjectivesProps) {
  const [newObjText, setNewObjText] = useState('');

  const addObjective = useCallback(() => {
    if (!newObjText.trim()) return;
    setObjectives((prev) => [
      ...prev,
      { id: genId(), text: newObjText.trim(), done: false, createdAt: Date.now() },
    ]);
    setNewObjText('');
  }, [newObjText, setObjectives]);

  const toggleObjective = useCallback(
    (id: string) => {
      setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, done: !o.done } : o)));
    },
    [setObjectives]
  );

  const deleteObjective = useCallback(
    (id: string) => {
      setObjectives((prev) => prev.filter((o) => o.id !== id));
    },
    [setObjectives]
  );

  return (
    <div className="w-52 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
      <div className="px-3 py-2 border-b border-slate-100">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          objectives
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {objectives.length === 0 && (
          <p className="text-[10px] text-slate-400 text-center py-4">no objectives yet</p>
        )}
        {objectives.map((obj) => (
          <div
            key={obj.id}
            className="group flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-slate-50"
          >
            <button
              onClick={() => toggleObjective(obj.id)}
              className="mt-0.5 w-3 h-3 rounded border border-slate-300 flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: obj.done ? '#059669' : 'transparent',
                borderColor: obj.done ? '#059669' : undefined,
              }}
            >
              {obj.done && <span className="text-[7px] text-white">✓</span>}
            </button>
            <span
              className={`text-[10px] flex-1 ${obj.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
            >
              {obj.text}
            </span>
            <button
              onClick={() => deleteObjective(obj.id)}
              className="text-[9px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <div className="flex-none p-2 border-t border-slate-100">
        <div className="flex gap-1">
          <input
            value={newObjText}
            onChange={(e) => setNewObjText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addObjective();
            }}
            placeholder="add objective..."
            className="flex-1 text-[10px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 outline-none focus:border-slate-400"
          />
          <button
            onClick={addObjective}
            className="px-2 py-1 bg-slate-800 text-white text-[9px] font-medium rounded hover:bg-slate-700"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
