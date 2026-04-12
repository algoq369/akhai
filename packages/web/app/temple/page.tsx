'use client';

import { useState } from 'react';
import ThesisRoom from '@/components/temple/ThesisRoom';
import LibraryRoom from '@/components/temple/LibraryRoom';

type Room = 'thesis' | 'constellation' | 'library';

const ROOMS: { id: Room; label: string }[] = [
  { id: 'thesis', label: '\u25CA The Thesis' },
  { id: 'constellation', label: '\u25C8 Constellation' },
  { id: 'library', label: '\u25C7 The Library' },
];

export default function TemplePage() {
  const [activeRoom, setActiveRoom] = useState<Room>('thesis');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[18px] tracking-widest text-zinc-400 mb-1">{'\u25CA'} MYSTIC TEMPLE</h1>
        <p className="text-[13px] text-zinc-500 italic mb-1">
          Rallumer la Flamme — Reignite the Flame
        </p>
        <p className="text-[11px] text-zinc-400">
          A sanctuary of sovereign knowledge where all traditions converge
        </p>
      </div>

      {/* Room tabs */}
      <div className="flex items-center gap-1 mb-6">
        {ROOMS.map((room) => (
          <button
            key={room.id}
            onClick={() =>
              room.id === 'constellation'
                ? window.location.assign('/constellation')
                : setActiveRoom(room.id)
            }
            className={`text-[10px] px-3 py-1 rounded-md border transition-colors ${
              activeRoom === room.id
                ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                : 'border-zinc-800/50 text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {room.label}
          </button>
        ))}
      </div>

      {/* Active room */}
      {activeRoom === 'thesis' && <ThesisRoom />}
      {activeRoom === 'library' && <LibraryRoom />}
    </div>
  );
}
