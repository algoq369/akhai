import { NextRequest, NextResponse } from 'next/server';

// In-memory settings storage (would be database in production)
let settingsStore = {
  apiKeys: {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    deepseek: process.env.DEEPSEEK_API_KEY || '',
    xai: process.env.XAI_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
  },
  modelConfig: {
    motherBase: 'claude-sonnet-4-20250514',
    slot1: 'deepseek-chat',
    slot2: 'grok-3',
  },
  consensus: {
    maxRounds: 3,
    timeoutSeconds: 30,
    autoApproveThreshold: 85,
  },
  appearance: {
    compactView: false,
  },
};

export async function GET() {
  try {
    // Mask API keys before sending (don't expose full keys)
    const maskedSettings = {
      ...settingsStore,
      apiKeys: {
        anthropic: maskApiKey(settingsStore.apiKeys.anthropic),
        deepseek: maskApiKey(settingsStore.apiKeys.deepseek),
        xai: maskApiKey(settingsStore.apiKeys.xai),
        openrouter: maskApiKey(settingsStore.apiKeys.openrouter),
      },
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();

    // Validate settings structure
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // Update settings store
    // In production, this would save to a database
    if (settings.apiKeys) {
      // Only update keys that are not masked
      Object.keys(settings.apiKeys).forEach((provider) => {
        const key = settings.apiKeys[provider];
        if (key && !key.includes('*')) {
          settingsStore.apiKeys[provider as keyof typeof settingsStore.apiKeys] = key;
        }
      });
    }

    if (settings.modelConfig) {
      settingsStore.modelConfig = {
        ...settingsStore.modelConfig,
        ...settings.modelConfig,
      };
    }

    if (settings.consensus) {
      settingsStore.consensus = {
        ...settingsStore.consensus,
        ...settings.consensus,
      };
    }

    if (settings.appearance) {
      settingsStore.appearance = {
        ...settingsStore.appearance,
        ...settings.appearance,
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '';
  return key.slice(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.slice(-4);
}
