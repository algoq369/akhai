import { NextResponse } from 'next/server';
import { getStats } from '@/lib/database';

type ProviderStatus = 'active' | 'inactive' | 'error';

export async function GET() {
  try {
    const stats = getStats();

    // Build provider status from database stats and environment variables
    const providerStatsMap = new Map(
      stats.providerStats.map((p) => [p.provider, p])
    );

    const anthropicStatus: ProviderStatus = process.env.ANTHROPIC_API_KEY ? 'active' : 'inactive';
    const deepseekStatus: ProviderStatus = process.env.DEEPSEEK_API_KEY ? 'active' : 'inactive';
    const xaiStatus: ProviderStatus = process.env.XAI_API_KEY ? 'active' : 'inactive';
    const mistralStatus: ProviderStatus = process.env.MISTRAL_API_KEY ? 'active' : 'inactive';
    const openrouterStatus: ProviderStatus = process.env.OPENROUTER_API_KEY ? 'active' : 'inactive';

    const providers = {
      anthropic: {
        status: anthropicStatus,
        queries: providerStatsMap.get('anthropic')?.queries || 0,
        cost: providerStatsMap.get('anthropic')?.cost || 0,
      },
      deepseek: {
        status: deepseekStatus,
        queries: providerStatsMap.get('deepseek')?.queries || 0,
        cost: providerStatsMap.get('deepseek')?.cost || 0,
      },
      xai: {
        status: xaiStatus,
        queries: providerStatsMap.get('xai')?.queries || 0,
        cost: providerStatsMap.get('xai')?.cost || 0,
      },
      mistral: {
        status: mistralStatus,
        queries: providerStatsMap.get('mistral')?.queries || 0,
        cost: providerStatsMap.get('mistral')?.cost || 0,
      },
      openrouter: {
        status: openrouterStatus,
        queries: providerStatsMap.get('openrouter')?.queries || 0,
        cost: providerStatsMap.get('openrouter')?.cost || 0,
      },
    };

    return NextResponse.json({
      queriesToday: stats.queriesToday,
      queriesThisMonth: stats.queriesThisMonth,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost,
      avgResponseTime: Math.round(stats.avgResponseTime * 10) / 10,
      providers,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
