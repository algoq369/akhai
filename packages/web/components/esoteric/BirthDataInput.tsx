'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BirthData, NatalChart } from '@/lib/esoteric/natal-engine';
import { computeNatalChart, saveBirthData, loadBirthData } from '@/lib/esoteric/natal-engine';

const CITIES: { label: string; lat: number; lng: number; tz: string }[] = [
  { label: 'Paris', lat: 48.86, lng: 2.35, tz: 'Europe/Paris' },
  { label: 'London', lat: 51.51, lng: -0.13, tz: 'Europe/London' },
  { label: 'New York', lat: 40.71, lng: -74.01, tz: 'America/New_York' },
  { label: 'Los Angeles', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles' },
  { label: 'Chicago', lat: 41.88, lng: -87.63, tz: 'America/Chicago' },
  { label: 'Tokyo', lat: 35.68, lng: 139.69, tz: 'Asia/Tokyo' },
  { label: 'Berlin', lat: 52.52, lng: 13.41, tz: 'Europe/Berlin' },
  { label: 'Rome', lat: 41.9, lng: 12.5, tz: 'Europe/Rome' },
  { label: 'Madrid', lat: 40.42, lng: -3.7, tz: 'Europe/Madrid' },
  { label: 'Lisbon', lat: 38.72, lng: -9.14, tz: 'Europe/Lisbon' },
  { label: 'Amsterdam', lat: 52.37, lng: 4.9, tz: 'Europe/Amsterdam' },
  { label: 'Brussels', lat: 50.85, lng: 4.35, tz: 'Europe/Brussels' },
  { label: 'Vienna', lat: 48.21, lng: 16.37, tz: 'Europe/Vienna' },
  { label: 'Geneva', lat: 46.2, lng: 6.14, tz: 'Europe/Zurich' },
  { label: 'Stockholm', lat: 59.33, lng: 18.07, tz: 'Europe/Stockholm' },
  { label: 'Moscow', lat: 55.76, lng: 37.62, tz: 'Europe/Moscow' },
  { label: 'Istanbul', lat: 41.01, lng: 28.98, tz: 'Europe/Istanbul' },
  { label: 'Dubai', lat: 25.2, lng: 55.27, tz: 'Asia/Dubai' },
  { label: 'Mumbai', lat: 19.08, lng: 72.88, tz: 'Asia/Kolkata' },
  { label: 'Delhi', lat: 28.61, lng: 77.21, tz: 'Asia/Kolkata' },
  { label: 'Beijing', lat: 39.9, lng: 116.4, tz: 'Asia/Shanghai' },
  { label: 'Shanghai', lat: 31.23, lng: 121.47, tz: 'Asia/Shanghai' },
  { label: 'Seoul', lat: 37.57, lng: 126.98, tz: 'Asia/Seoul' },
  { label: 'Bangkok', lat: 13.76, lng: 100.5, tz: 'Asia/Bangkok' },
  { label: 'Singapore', lat: 1.35, lng: 103.82, tz: 'Asia/Singapore' },
  { label: 'Sydney', lat: -33.87, lng: 151.21, tz: 'Australia/Sydney' },
  { label: 'Melbourne', lat: -37.81, lng: 144.96, tz: 'Australia/Melbourne' },
  { label: 'São Paulo', lat: -23.55, lng: -46.63, tz: 'America/Sao_Paulo' },
  { label: 'Buenos Aires', lat: -34.6, lng: -58.38, tz: 'America/Argentina/Buenos_Aires' },
  { label: 'Mexico City', lat: 19.43, lng: -99.13, tz: 'America/Mexico_City' },
  { label: 'Cairo', lat: 30.04, lng: 31.24, tz: 'Africa/Cairo' },
  { label: 'Lagos', lat: 6.52, lng: 3.38, tz: 'Africa/Lagos' },
  { label: 'Nairobi', lat: -1.29, lng: 36.82, tz: 'Africa/Nairobi' },
  { label: 'Casablanca', lat: 33.57, lng: -7.59, tz: 'Africa/Casablanca' },
  { label: 'Johannesburg', lat: -26.2, lng: 28.05, tz: 'Africa/Johannesburg' },
  { label: 'Toronto', lat: 43.65, lng: -79.38, tz: 'America/Toronto' },
  { label: 'Montreal', lat: 45.5, lng: -73.57, tz: 'America/Toronto' },
  { label: 'Tehran', lat: 35.69, lng: 51.39, tz: 'Asia/Tehran' },
  { label: 'Islamabad', lat: 33.69, lng: 73.04, tz: 'Asia/Karachi' },
  { label: 'Karachi', lat: 24.86, lng: 67.01, tz: 'Asia/Karachi' },
  { label: 'Lahore', lat: 31.55, lng: 74.35, tz: 'Asia/Karachi' },
  { label: 'Kabul', lat: 34.53, lng: 69.17, tz: 'Asia/Kabul' },
  { label: 'Riyadh', lat: 24.69, lng: 46.72, tz: 'Asia/Riyadh' },
  { label: 'Doha', lat: 25.29, lng: 51.53, tz: 'Asia/Qatar' },
  { label: 'Algiers', lat: 36.75, lng: 3.04, tz: 'Africa/Algiers' },
  { label: 'Tunis', lat: 36.81, lng: 10.17, tz: 'Africa/Tunis' },
  { label: 'Dakar', lat: 14.69, lng: -17.44, tz: 'Africa/Dakar' },
  { label: 'Beirut', lat: 33.89, lng: 35.5, tz: 'Asia/Beirut' },
  { label: 'Baghdad', lat: 33.31, lng: 44.37, tz: 'Asia/Baghdad' },
  { label: 'Jakarta', lat: -6.21, lng: 106.85, tz: 'Asia/Jakarta' },
  { label: 'Kuala Lumpur', lat: 3.14, lng: 101.69, tz: 'Asia/Kuala_Lumpur' },
  { label: 'Manila', lat: 14.6, lng: 120.98, tz: 'Asia/Manila' },
  { label: 'Quetta', lat: 30.18, lng: 66.98, tz: 'Asia/Karachi' },
  { label: 'Peshawar', lat: 34.01, lng: 71.58, tz: 'Asia/Karachi' },
  { label: 'Marseille', lat: 43.3, lng: 5.37, tz: 'Europe/Paris' },
  { label: 'Lyon', lat: 45.76, lng: 4.84, tz: 'Europe/Paris' },
  { label: 'Bordeaux', lat: 44.84, lng: -0.58, tz: 'Europe/Paris' },
  { label: 'Strasbourg', lat: 48.57, lng: 7.75, tz: 'Europe/Paris' },
  { label: 'Athens', lat: 37.98, lng: 23.73, tz: 'Europe/Athens' },
  { label: 'Warsaw', lat: 52.23, lng: 21.01, tz: 'Europe/Warsaw' },
  { label: 'Prague', lat: 50.08, lng: 14.44, tz: 'Europe/Prague' },
  { label: 'Budapest', lat: 47.5, lng: 19.04, tz: 'Europe/Budapest' },
  { label: 'Dublin', lat: 53.35, lng: -6.26, tz: 'Europe/Dublin' },
  { label: 'Zurich', lat: 47.38, lng: 8.54, tz: 'Europe/Zurich' },
  { label: 'Copenhagen', lat: 55.68, lng: 12.57, tz: 'Europe/Copenhagen' },
  { label: 'Oslo', lat: 59.91, lng: 10.75, tz: 'Europe/Oslo' },
  { label: 'Helsinki', lat: 60.17, lng: 24.94, tz: 'Europe/Helsinki' },
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
  const [city, setCity] = useState('');
  const [cityStatus, setCityStatus] = useState('');

  // Estimate timezone from longitude
  const estimateTz = useCallback((latitude: number, longitude: number): string => {
    const match = CITIES.find(
      (c) => Math.abs(c.lat - latitude) < 2 && Math.abs(c.lng - longitude) < 5
    );
    if (match) return match.tz;
    const offset = Math.round(longitude / 15);
    const tzMap: Record<string, string> = {
      '-5': 'America/New_York',
      '-6': 'America/Chicago',
      '-7': 'America/Denver',
      '-8': 'America/Los_Angeles',
      '0': 'Europe/London',
      '1': 'Europe/Paris',
      '2': 'Europe/Berlin',
      '3': 'Europe/Moscow',
      '4': 'Asia/Dubai',
      '5': 'Asia/Karachi',
      '6': 'Asia/Dhaka',
      '7': 'Asia/Bangkok',
      '8': 'Asia/Shanghai',
      '9': 'Asia/Tokyo',
      '10': 'Australia/Sydney',
    };
    return tzMap[String(offset)] || 'UTC';
  }, []);

  // Lookup city → fill lat/lng directly
  const lookupCity = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      // Try local first (instant)
      const local = CITIES.find((c) => c.label.toLowerCase() === trimmed.toLowerCase());
      if (local) {
        setLat(String(local.lat));
        setLng(String(local.lng));
        setTz(local.tz);
        setCityStatus(`${local.label} (${local.lat}, ${local.lng})`);
        return;
      }
      // API call
      setCityStatus('searching...');
      try {
        const res = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: trimmed }),
        });
        const data = await res.json();
        if (data.found) {
          const rLat = data.lat.toFixed(4);
          const rLng = data.lng.toFixed(4);
          setLat(rLat);
          setLng(rLng);
          setTz(estimateTz(parseFloat(rLat), parseFloat(rLng)));
          setCityStatus(`${data.name} (${rLat}, ${rLng})`);
        } else {
          setCityStatus('city not found — enter coordinates manually');
        }
      } catch {
        setCityStatus('lookup failed — enter coordinates manually');
      }
    },
    [estimateTz]
  );

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

  // (selectCity removed — lookupCity handles everything)

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
          {Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => 1920 + i).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
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

      {/* City lookup */}
      <div className="mb-1">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              lookupCity(city);
            }
          }}
          onBlur={() => {
            if (city.trim()) lookupCity(city);
          }}
          placeholder="Enter city name, press Enter"
          className={INP + ' w-full'}
        />
      </div>
      {cityStatus && (
        <div
          className={`text-[9px] mb-2 ${cityStatus.includes('not found') || cityStatus.includes('failed') ? 'text-red-400' : cityStatus === 'searching...' ? 'text-zinc-400 italic' : 'text-green-600'}`}
        >
          {cityStatus === 'searching...'
            ? '○ '
            : cityStatus.includes('not found') || cityStatus.includes('failed')
              ? '✗ '
              : '✓ '}
          {cityStatus}
        </div>
      )}

      {/* Lat/Lng (auto-filled from city, or manual) */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <input
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
          className={INP}
        />
        <input
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude"
          className={INP}
        />
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
