import { NextResponse } from 'next/server';

export async function GET() {
  const keys = {
    anthropic: process.env.ANTHROPIC_API_KEY 
      ? `${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...` 
      : 'NOT SET',
    deepseek: process.env.DEEPSEEK_API_KEY 
      ? `${process.env.DEEPSEEK_API_KEY.substring(0, 15)}...` 
      : 'NOT SET',
    xai: process.env.XAI_API_KEY 
      ? `${process.env.XAI_API_KEY.substring(0, 15)}...` 
      : 'NOT SET',
    openrouter: process.env.OPENROUTER_API_KEY 
      ? `${process.env.OPENROUTER_API_KEY.substring(0, 15)}...` 
      : 'NOT SET',
    brave: process.env.BRAVE_SEARCH_API_KEY 
      ? `${process.env.BRAVE_SEARCH_API_KEY.substring(0, 15)}...` 
      : 'NOT SET',
  };

  const allSet = Object.values(keys).every(k => k !== 'NOT SET');

  return NextResponse.json({ 
    status: allSet ? 'all_keys_configured' : 'missing_keys',
    keys,
    env_file_loaded: allSet,
    timestamp: new Date().toISOString()
  });
}
