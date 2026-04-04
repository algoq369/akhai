import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createQueryRecord, updateQueryStatus, addQueryEvent } from '@/lib/query-store';
import { getRateLimitKey, checkRateLimit } from './rate-limit';
import { classifyQuery } from '@/lib/query-classifier';
import { processQuery } from '@/lib/query-handler';

export const dynamic = 'force-dynamic';

// Zod input validation schema
const QuerySchema = z.object({
  query: z.string().min(1).max(10000),
  flow: z.string().optional(),
  methodology: z.string().optional(),
  conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
});

export async function POST(request: NextRequest) {
  try {
    // Security: Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    const { allowed, remaining } = checkRateLimit(rateLimitKey);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before making more requests.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        }
      );
    }

    const parsed = QuerySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }
    const { query, flow, methodology, conversationHistory } = parsed.data;

    console.log('=== QUERY RECEIVED ===', {
      query: query?.substring(0, 50),
      methodology,
      flow,
      historyLength: conversationHistory.length,
    });

    // SMART DETECTION: Classify query before processing
    const classification = classifyQuery(query);
    console.log('=== QUERY CLASSIFICATION ===', classification);

    const queryId = nanoid(10);

    // Auto-select methodology based on classification
    // If user explicitly set methodology, respect it (unless it's 'auto')
    let finalMethodology = methodology || flow || 'A';

    // If 'auto' OR no methodology specified, use smart detection
    if (finalMethodology === 'auto' || !methodology) {
      finalMethodology = classification.suggestedMethodology;
      console.log(`=== AUTO-ROUTING: ${query.substring(0, 30)} → ${finalMethodology} ===`);
      console.log(`=== REASON: ${classification.reason} ===`);
    }

    // Create query in database and memory
    createQueryRecord(
      queryId,
      query,
      finalMethodology as 'A' | 'B' | 'direct' | 'tot' | 'cot' | 'aot' | 'auto'
    );

    // Start processing in background with real AkhAI integration
    processQuery(queryId, finalMethodology, conversationHistory).catch((error) => {
      console.error('Query processing error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      updateQueryStatus(queryId, 'error', undefined, errorMessage);
      addQueryEvent(queryId, 'error', { message: errorMessage });
    });

    return NextResponse.json({ queryId });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
