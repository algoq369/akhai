import { NextResponse } from 'next/server';

async function testProvider(
  name: string,
  url: string,
  headers: Record<string, string>,
  body: object
): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, latency, error: `${res.status}: ${text.substring(0, 200)}` };
    }

    return { ok: true, latency };
  } catch (e: any) {
    return { 
      ok: false, 
      latency: Date.now() - start, 
      error: e.name === 'AbortError' ? 'Timeout after 30s' : e.message 
    };
  }
}

export async function GET() {
  const results: Record<string, any> = {};

  // Test Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    results.anthropic = await testProvider(
      'Anthropic',
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say hi' }],
      }
    );
  } else {
    results.anthropic = { ok: false, latency: 0, error: 'API key not set' };
  }

  // Test DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    results.deepseek = await testProvider(
      'DeepSeek',
      'https://api.deepseek.com/v1/chat/completions',
      { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      {
        model: 'deepseek-chat',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say hi' }],
      }
    );
  } else {
    results.deepseek = { ok: false, latency: 0, error: 'API key not set' };
  }

  // Test xAI (Grok)
  if (process.env.XAI_API_KEY) {
    results.xai = await testProvider(
      'xAI',
      'https://api.x.ai/v1/chat/completions',
      { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      {
        model: 'grok-3',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say hi' }],
      }
    );
  } else {
    results.xai = { ok: false, latency: 0, error: 'API key not set' };
  }

  // Test Mistral
  if (process.env.MISTRAL_API_KEY) {
    results.mistral = await testProvider(
      'Mistral',
      'https://api.mistral.ai/v1/chat/completions',
      { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
      {
        model: 'mistral-small-latest',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say hi' }],
      }
    );
  } else {
    results.mistral = { ok: false, latency: 0, error: 'API key not set' };
  }

  const allOk = Object.values(results).every((r: any) => r.ok);
  const workingCount = Object.values(results).filter((r: any) => r.ok).length;

  return NextResponse.json({
    status: allOk ? 'all_providers_working' : `${workingCount}/4 providers working`,
    results,
    timestamp: new Date().toISOString(),
  });
}
