import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPositions, getConvergence } from '@/lib/esoteric/cycle-engine';
import { callProvider } from '@/lib/multi-provider-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const chart = body.chart;
    const mode: 'secular' | 'esoteric' = body.mode === 'esoteric' ? 'esoteric' : 'secular';

    if (!chart?.northNode) {
      return NextResponse.json({ error: 'chart with northNode is required' }, { status: 400 });
    }

    const positions = getCurrentPositions();
    const convergence = getConvergence();

    const systemPrompt =
      mode === 'secular'
        ? "You are AkhAI's integral analyst. Synthesize personal natal chart data with macro-cyclical frameworks. Write 4-5 paragraphs weaving the user's North Node position through the current state of all 5 frameworks (Barbault, Turchin, Kondratieff, Strauss-Howe, Dalio). Be specific — reference exact framework values and the user's exact nodal position. Use developmental and psychological language. No esoteric terminology."
        : "You are AkhAI's integral analyst. Synthesize personal natal chart data with macro-cyclical frameworks. Write 4-5 paragraphs weaving the user's North Node position through the current state of all 5 frameworks (Barbault, Turchin, Kondratieff, Strauss-Howe, Dalio). Be specific — reference exact framework values and the user's exact nodal position. Use traditional astrological and cross-civilizational terminology freely — Hermetic, Khaldunian, Vedic language is appropriate.";

    const userData = {
      northNode: {
        sign: chart.northNode.sign,
        house: chart.northNode.house,
        degree: chart.northNode.formattedDegree,
        aspects: chart.aspects,
      },
      southNode: { sign: chart.southNode.sign, house: chart.southNode.house },
      macroPositions: {
        barbault: {
          index: positions.barbault.currentIndex,
          trend: positions.barbault.trend,
          event: positions.barbault.nearestEvent,
        },
        turchin: {
          psi: positions.turchin.psi,
          phase: positions.turchin.phase,
          emp: positions.turchin.emp,
        },
        kondratieff: {
          wave: positions.kondratieff.waveName,
          phase: positions.kondratieff.phase,
          perez: positions.kondratieff.perezStage,
        },
        straussHowe: {
          turning: positions.straussHowe.turningName,
          yearsRemaining: positions.straussHowe.yearsRemaining,
          climax: positions.straussHowe.climax,
        },
        dalio: {
          usStage: positions.dalio.usStageName,
          topNation: positions.dalio.topNations[0]?.name,
        },
      },
      convergence: {
        score: convergence.current.score,
        max: convergence.current.maxScore,
        label: convergence.current.label,
      },
    };

    let synthesis: string;
    let cost = 0;

    try {
      const response = await callProvider('anthropic', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userData, null, 2) },
        ],
        model: 'claude-opus-4-6',
        maxTokens: 600,
        temperature: 0.7,
      });
      synthesis = response.content;
      cost = response.cost;
    } catch {
      synthesis = 'Synthesis unavailable \u2014 API credits exhausted';
    }

    return NextResponse.json({ synthesis, cost });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
