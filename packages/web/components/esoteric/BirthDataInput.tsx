'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BirthData, NatalChart } from '@/lib/esoteric/natal-engine';
import { computeNatalChart, saveBirthData, loadBirthData } from '@/lib/esoteric/natal-engine';

const CITIES: { label: string; lat: number; lng: number; tz: string }[] = [
  { label: 'Paris', lat: 48.86, lng: 2.35, tz: 'Europe/Paris' },
  { label: 'London', lat: 51.51, lng: -0.13, tz: 'Europe/London' },
  { label: 'New York', lat: 40.71, lng: -74.01, tz: 'America/New_York' },
  { label: 'Tokyo', lat: 35.68, lng: 139.69, tz: 'Asia/Tokyo' },
  { label: 'Zurich', lat: 47.38, lng: 8.54, tz: 'Europe/Zurich' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Zurich',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC',
];

const SEL =
  'bg-white border border-zinc-200 rounded-md px-2 py-1 text-[11px] font-mono text-zinc-700 focus:outline-none focus:border-zinc-400';
const INP =
  'bg-white border border-zinc-200 rounded-md px-2 py-1.5 text-[11px] font-mono text-zinc-700 focus:outline-none focus:border-zinc-400';

interface Props {
  onChartComputed: (chart: NatalChart, data: BirthData) => void;
}

export default function BirthDataInput({ onChartComputed }: Props) {
  const [name, setName] = useState('You');
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [tz, setTz] = useState('UTC');
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    const saved = loadBirthData();
    if (saved) {
      setName(saved.name);
      setYear(saved.year);
      setMonth(saved.month);
      setDay(saved.day);
      setHour(saved.hour);
      setMinute(saved.minute);
      setLat(String(saved.latitude));
      setLng(String(saved.longitude));
      setTz(saved.timezone);
    }
  }, []);

  const selectCity = useCallback((c: (typeof CITIES)[number]) => {
    setLat(String(c.lat));
    setLng(String(c.lng));
    setTz(c.tz);
  }, []);

  const handleCompute = useCallback(() => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;
    setComputing(true);
    // Defer to next tick so the UI updates with loading state
    setTimeout(() => {
      const data: BirthData = {
        name,
        year,
        month,
        day,
        hour,
        minute,
        latitude: latNum,
        longitude: lngNum,
        timezone: tz,
      };
      const chart = computeNatalChart(data);
      saveBirthData(data);
      onChartComputed(chart, data);
      setComputing(false);
    }, 10);
  }, [name, year, month, day, hour, minute, lat, lng, tz, onChartComputed]);

  const valid = lat !== '' && lng !== '' && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-3">birth data</div>

      {/* Name */}
      <div className="mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className={`${INP} w-full`}
        />
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        <select value={year} onChange={(e) => setYear(+e.target.value)} className={SEL}>
          {Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => 1920 + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select value={month} onChange={(e) => setMonth(+e.target.value)} className={SEL}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
        <select value={day} onChange={(e) => setDay(+e.target.value)} className={SEL}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {String(d).padStart(2, '0')}
            </option>
          ))}
        </select>
        <select value={hour} onChange={(e) => setHour(+e.target.value)} className={SEL}>
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}h
            </option>
          ))}
        </select>
        <select value={minute} onChange={(e) => setMinute(+e.target.value)} className={SEL}>
          {Array.from({ length: 60 }, (_, i) => i).map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}m
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <input
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude (e.g. 48.86)"
          className={INP}
        />
        <input
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude (e.g. 2.35)"
          className={INP}
        />
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {CITIES.map((c) => (
          <button
            key={c.label}
            onClick={() => selectCity(c)}
            className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 transition-colors"
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Timezone */}
      <div className="mb-4">
        <select value={tz} onChange={(e) => setTz(e.target.value)} className={`${SEL} w-full`}>
          {TIMEZONES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Compute */}
      <button
        onClick={handleCompute}
        disabled={!valid || computing}
        className="w-full px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {computing ? 'Computing\u2026' : 'COMPUTE CHART'}
      </button>
    </div>
  );
}
