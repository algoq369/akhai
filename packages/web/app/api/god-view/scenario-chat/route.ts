import { NextRequest, NextResponse } from 'next/server';
import { callProvider } from '@/lib/multi-provider-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { branchSummary, keyEvents, question, messages } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const eventsText = (keyEvents || []).map((e: string, i: number) => `${i + 1}. ${e}`).join('\n');

    const systemPrompt = `You exist in a predicted future world. Here is the scenario:

${branchSummary || 'No scenario context provided.'}

The following events occurred in this timeline:
${eventsText || 'No specific events listed.'}

You are an analyst living inside this predicted future. Answer questions from that perspective. Be specific, reference the scenario events, and stay in character. Keep responses concise (2-3 paragraphs).`;

    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...(messages || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const result = await callProvider('anthropic', {
      messages: conversationMessages,
      model: 'claude-sonnet-4-6',
      maxTokens: 400,
      temperature: 0.7,
    });

    return NextResponse.json({
      response: result.content,
      cost: result.cost,
    });
  } catch (error) {
    console.error('Scenario chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
