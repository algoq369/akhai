/**
 * Canvas Visualization API - Deterministic JSON output for diagram/chart generation
 * Lower token limit and temperature:0 for reliable structured output
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callProvider } from '@/lib/multi-provider-api';

export const dynamic = 'force-dynamic';

const CanvasVizSchema = z.object({
  query: z.string().min(1).max(10000),
  response: z.string().default(''),
  type: z.enum(['diagram', 'chart', 'table', 'timeline', 'radar']),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = CanvasVizSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }
    const { query, response, type } = parsed.data;

    const prompts: Record<string, string> = {
      diagram:
        'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate a diagram from the user content.\nFormat: { "title": "short title", "type": "flowchart|mindmap|sequence", "nodes": [{"id":"n1","label":"text","color":"#hex"}], "edges": [{"from":"n1","to":"n2","label":"optional"}] }',
      chart:
        'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate chart data from the user content.\nFormat: { "title": "chart title", "xLabel": "x axis", "yLabel": "y axis", "data": [{"label":"item","value":number,"color":"#hex"}] }\nIf no numeric data exists, estimate reasonable proportional values.',
      table:
        'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate a comparison table from the user content.\nFormat: { "title": "table title", "columns": ["Col1","Col2","Col3"], "rows": [{"col1":"val","col2":"val","col3":"val"}] }\nExtract key entities and their attributes. 3-6 rows, 2-4 columns.',
      timeline:
        'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate a timeline from the user content.\nFormat: { "title": "timeline title", "events": [{"label":"event name","description":"brief","color":"#hex"}] }\nExtract sequential steps or chronological events. 3-8 events.',
      radar:
        'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate radar chart data from the user content.\nFormat: { "title": "radar title", "axes": [{"label":"dimension","value":0-100}] }\nExtract 3-8 dimensions with estimated scores. Values must be 0-100.',
    };
    const systemPrompt = prompts[type];

    const userContent = `Query: ${query}\nResponse: ${(response || '').slice(0, 800)}`;

    const vizRequest = {
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userContent },
      ],
      model: 'claude-opus-4-7',
      maxTokens: 1500,
    };

    let result;
    try {
      result = await callProvider('anthropic', vizRequest);
    } catch (err: any) {
      if (
        err.message?.includes('credit balance') ||
        err.message?.includes('402') ||
        err.message?.includes('400')
      ) {
        console.log('[CanvasViz] Anthropic credits depleted, falling back to OpenRouter');
        // OpenRouter free models: merge system into user prompt, use temperature 0.3
        result = await callProvider('openrouter', {
          ...vizRequest,
          messages: [{ role: 'user' as const, content: `${systemPrompt}\n\n${userContent}` }],
          temperature: 0.3,
          maxTokens: 1500,
        });
      } else {
        throw err;
      }
    }

    const text = result.content || '';

    // Strategy 1: strict parse of full matched JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return NextResponse.json({ viz: JSON.parse(jsonMatch[0]) });
      } catch {
        // Fall through to salvage
      }
    }

    // Strategy 2: salvage — walk string, track brace depth, try progressively shorter JSON until one parses
    if (jsonMatch) {
      const raw = jsonMatch[0];
      for (let end = raw.length; end > 50; end -= 10) {
        const candidate = raw.slice(0, end);
        const lastBrace = candidate.lastIndexOf('}');
        if (lastBrace < 0) continue;
        const truncated = candidate.slice(0, lastBrace + 1);
        const opens = (truncated.match(/\{/g) || []).length;
        const closes = (truncated.match(/\}/g) || []).length;
        const balanced = truncated + '}'.repeat(Math.max(0, opens - closes));
        const openBr = (balanced.match(/\[/g) || []).length;
        const closeBr = (balanced.match(/\]/g) || []).length;
        const fullyBalanced = balanced.replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');
        const withArrays = fullyBalanced + ']'.repeat(Math.max(0, openBr - closeBr));
        try {
          const salvaged = JSON.parse(withArrays);
          console.log('[CanvasViz] Salvaged malformed JSON at end=' + end);
          return NextResponse.json({ viz: salvaged, salvaged: true });
        } catch {
          continue;
        }
      }
    }

    console.error('[CanvasViz] Parse failed. Raw text:', text.slice(0, 400));
    return NextResponse.json(
      { error: 'Failed to parse JSON from response', raw: text.slice(0, 500) },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('[CanvasViz] Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
