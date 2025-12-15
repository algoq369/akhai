import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, key } = await request.json();

    if (!provider || !key) {
      return NextResponse.json(
        { success: false, error: 'Provider and key are required' },
        { status: 400 }
      );
    }

    let testResult = false;
    let errorMessage = '';

    try {
      switch (provider) {
        case 'anthropic':
          testResult = await testAnthropicKey(key);
          break;
        case 'deepseek':
          testResult = await testDeepSeekKey(key);
          break;
        case 'xai':
          testResult = await testXAIKey(key);
          break;
        case 'openrouter':
          testResult = await testOpenRouterKey(key);
          break;
        default:
          return NextResponse.json(
            { success: false, error: 'Invalid provider' },
            { status: 400 }
          );
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      testResult = false;
    }

    return NextResponse.json({
      success: testResult,
      error: testResult ? null : errorMessage || 'API key test failed',
    });
  } catch (error) {
    console.error('Test key API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test API key' },
      { status: 500 }
    );
  }
}

async function testAnthropicKey(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  });

  return response.ok;
}

async function testDeepSeekKey(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10,
    }),
  });

  return response.ok;
}

async function testXAIKey(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10,
    }),
  });

  return response.ok;
}

async function testOpenRouterKey(apiKey: string): Promise<boolean> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://akhai.app',
      'X-Title': 'AkhAI',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10,
    }),
  });

  return response.ok;
}
