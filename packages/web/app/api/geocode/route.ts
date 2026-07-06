import { NextRequest, NextResponse } from 'next/server';
import { GeocodeSchema } from '@/lib/route-schemas';

export async function POST(request: NextRequest) {
  try {
    const parsed = GeocodeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { city } = parsed.data;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AkhAI/1.0 (akhai.app)' } });
    const data = await res.json();
    if (data.length > 0) {
      const r = data[0];
      return NextResponse.json({
        found: true,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        name: r.display_name.split(',').slice(0, 2).join(',').trim(),
      });
    }
    return NextResponse.json({ found: false });
  } catch {
    return NextResponse.json({ found: false, error: 'Geocoding service unavailable' });
  }
}
