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
        'You are a JSON generator. Output ONLY valid JSON. Generate a rich, detailed diagram from the user content.\nFormat: { "title": "descriptive title", "type": "flowchart|mindmap|sequence", "nodes": [{"id":"n1","label":"concise label (max 8 words)","color":"#hex","group":"optional category"}], "edges": [{"from":"n1","to":"n2","label":"relationship verb"}] }\nRules:\n- Extract 8-15 nodes covering ALL key concepts, entities, or steps\n- Use meaningful edge labels that describe the relationship (causes, enables, blocks, feeds, requires)\n- Group related nodes with the same color\n- Ensure every node connects to at least one other node\n- For processes: use flowchart type with sequential edges\n- For concepts: use mindmap type with hierarchical edges\n- For interactions: use sequence type with temporal edges',
      chart:
        'You are a JSON generator. Output ONLY valid JSON. Generate detailed chart data from the user content.\nFormat: { "title": "descriptive chart title", "xLabel": "x axis label", "yLabel": "y axis label", "data": [{"label":"item name","value":number,"color":"#hex"}] }\nRules:\n- Extract 5-10 data points with realistic proportional values\n- If explicit numbers exist in the text, use them exactly\n- If no numbers exist, estimate reasonable comparative values (scale 0-100)\n- Use distinct colors for each data point\n- Sort data by value descending for readability\n- Labels should be concise (max 4 words)',
      table:
        'You are a JSON generator. Output ONLY valid JSON. Generate a comprehensive comparison table from the user content.\nFormat: { "title": "table title", "columns": ["Entity","Attribute 1","Attribute 2","Attribute 3","Assessment"], "rows": [{"Entity":"name","Attribute 1":"value",...}] }\nRules:\n- Extract 4-8 rows covering the main entities, concepts, or options discussed\n- Use 3-5 columns that capture the most important dimensions for comparison\n- Include a qualitative assessment column (e.g., Strong/Moderate/Weak or High/Medium/Low)\n- Cell values should be specific and informative, not generic\n- If numbers are mentioned, include them in the relevant cells',
      timeline:
        'You are a JSON generator. Output ONLY valid JSON. Generate a detailed timeline from the user content.\nFormat: { "title": "timeline title", "events": [{"label":"event name","description":"1-2 sentence context explaining significance","date":"year or time period if known","color":"#hex"}] }\nRules:\n- Extract 5-10 events in chronological or logical order\n- Each event must have a meaningful description (not just the label repeated)\n- If dates are mentioned, include them in the date field\n- If no dates, use relative ordering (Phase 1, Step 2, etc.)\n- Color-code by category or phase\n- Include both historical events and projected future events if discussed',
      radar:
        'You are a JSON generator. Output ONLY valid JSON. Generate detailed radar chart data from the user content.\nFormat: { "title": "radar chart title", "axes": [{"label":"dimension name","value":0-100,"rationale":"brief reason for score"}] }\nRules:\n- Extract 5-8 evaluation dimensions that matter for the topic\n- Score each dimension 0-100 based on evidence in the text\n- Include a brief rationale explaining why each score was assigned\n- Dimensions should be orthogonal (not overlapping)\n- At least one dimension should score below 50 and one above 70 for visual contrast',
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
