#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AKHAI TERMINAL - Sovereign AI Command Line Interface
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Usage:
 *   akhai                   Start interactive terminal
 *   akhai "query"           Single query with auto methodology
 *   akhai -m direct "q"     Query with specific methodology
 *   akhai --instinct "q"    Query with Instinct Mode
 *   akhai status            Show system status
 *   akhai config            Configure API keys
 * 
 * Methodologies:
 *   auto, direct, cod, bot, react, pot, gtp
 * 
 * Powered by Claude Opus 4.5 + AkhAI Sovereign Technology
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';

const VERSION = '0.1.0';

// ═══════════════════════════════════════════════════════════════════════════════
// BRANDING
// ═══════════════════════════════════════════════════════════════════════════════

const BANNER = `
${chalk.gray('═══════════════════════════════════════════════════════════════')}
${chalk.bold.white('  AKHAI')} ${chalk.gray('─')} ${chalk.white('school of thoughts')}
${chalk.gray('  SOVEREIGN TECHNOLOGY')}
${chalk.gray('═══════════════════════════════════════════════════════════════')}
`;

const MINI_BANNER = chalk.gray('◈') + ' ' + chalk.bold.white('AKHAI') + chalk.gray(' terminal');

// ═══════════════════════════════════════════════════════════════════════════════
// METHODOLOGIES
// ═══════════════════════════════════════════════════════════════════════════════

const METHODOLOGIES = {
  auto: { symbol: '◎', name: 'auto', color: chalk.gray, desc: 'Smart routing' },
  direct: { symbol: '→', name: 'direct', color: chalk.red, desc: 'Single AI instant' },
  cod: { symbol: '⋯', name: 'cod', color: chalk.hex('#f97316'), desc: 'Code optimized' },
  bot: { symbol: '◇', name: 'bot', color: chalk.yellow, desc: 'Conversational' },
  react: { symbol: '⟳', name: 'react', color: chalk.green, desc: 'Multi-step reasoning' },
  pot: { symbol: '△', name: 'pot', color: chalk.blue, desc: 'Potential exploration' },
  gtp: { symbol: '◯', name: 'gtp', color: chalk.magenta, desc: 'Multi-AI consensus' },
};

type Methodology = keyof typeof METHODOLOGIES;

// ═══════════════════════════════════════════════════════════════════════════════
// INSTINCT MODE
// ═══════════════════════════════════════════════════════════════════════════════

const INSTINCT_PROMPT = `
You are operating in INSTINCT MODE - AkhAI's highest intelligence tier.

CORE DIRECTIVE: Maximum insight, minimum noise.

PRINCIPLES:
1. INTUITIVE - Trust pattern recognition, lead with conclusions
2. KNOWLEDGE - Synthesize ALL relevant data instantly  
3. INSTINCTIVE - Select optimal path immediately, no hedging
4. EFFICIENT - Every word earns its place, no filler
5. SOVEREIGN - Independent analysis, original synthesis

OUTPUT FORMAT:
▸ SIGNAL: [One sentence core insight]
▸ DATA: [Key facts with confidence]
▸ STANCES: [Different viewpoints ranked]
▸ OPTIMAL: [Clear recommendation]
▸ TRAJECTORY: [Future direction]
▸ BLIND SPOTS: [What might be missed]
`;

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface Config {
  apiKey?: string;
  model: string;
  methodology: Methodology;
  instinctMode: boolean;
  endpoint: string;
}

function loadConfig(): Config {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.AKHAI_API_KEY,
    model: process.env.AKHAI_MODEL || 'claude-3-5-sonnet-20241022',
    methodology: (process.env.AKHAI_METHODOLOGY as Methodology) || 'auto',
    instinctMode: process.env.AKHAI_INSTINCT === 'true',
    endpoint: process.env.AKHAI_ENDPOINT || 'https://api.anthropic.com/v1/messages',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════════════════════

async function queryAI(
  query: string, 
  config: Config,
  conversationHistory: { role: string; content: string }[] = []
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('No API key. Set ANTHROPIC_API_KEY or run: akhai config');
  }

  const systemPrompt = config.instinctMode 
    ? INSTINCT_PROMPT 
    : `You are AKHAI, a sovereign AI assistant. Methodology: ${config.methodology}. Be direct, efficient, and insightful.`;

  const messages = [
    ...conversationHistory,
    { role: 'user', content: query }
  ];

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { content: { text: string }[] };
  return data.content[0]?.text || 'No response';
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE TERMINAL
// ═══════════════════════════════════════════════════════════════════════════════

async function interactiveMode(initialConfig: Config) {
  console.log(BANNER);
  
  const config = { ...initialConfig };
  const history: { role: string; content: string }[] = [];
  const commandHistory: string[] = [];
  let historyIndex = -1;

  // Status line
  const showStatus = () => {
    const m = METHODOLOGIES[config.methodology];
    const instinct = config.instinctMode ? chalk.hex('#f59e0b')(' ◈ INSTINCT') : '';
    console.log(
      chalk.gray('\n  ') + 
      m.color(m.symbol) + ' ' + 
      chalk.white(m.name) + 
      instinct + 
      chalk.gray(' │ ') +
      chalk.gray('/help for commands\n')
    );
  };

  showStatus();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    const m = METHODOLOGIES[config.methodology];
    const prefix = config.instinctMode 
      ? chalk.hex('#f59e0b')('◈ ') 
      : m.color(m.symbol + ' ');
    rl.question(prefix, handleInput);
  };

  const handleInput = async (input: string) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      prompt();
      return;
    }

    // Add to command history
    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    // Handle commands
    if (trimmed.startsWith('/')) {
      const [cmd, ...args] = trimmed.slice(1).split(' ');
      
      switch (cmd.toLowerCase()) {
        case 'help':
          console.log(`
${chalk.bold('AKHAI Terminal Commands')}

${chalk.cyan('/help')}              Show this help
${chalk.cyan('/clear')}             Clear conversation history
${chalk.cyan('/instinct')}          Toggle Instinct Mode
${chalk.cyan('/method')} ${chalk.gray('<name>')}    Switch methodology (auto, direct, cod, bot, react, pot, gtp)
${chalk.cyan('/status')}            Show current settings
${chalk.cyan('/history')}           Show command history
${chalk.cyan('/export')}            Export conversation
${chalk.cyan('/exit')}              Exit terminal

${chalk.bold('Methodologies')}
${Object.entries(METHODOLOGIES).map(([id, m]) => 
  `  ${m.color(m.symbol)} ${chalk.white(id.padEnd(8))} ${chalk.gray(m.desc)}`
).join('\n')}
`);
          break;

        case 'clear':
          history.length = 0;
          console.log(chalk.gray('  Conversation cleared\n'));
          break;

        case 'instinct':
          config.instinctMode = !config.instinctMode;
          console.log(
            config.instinctMode 
              ? chalk.hex('#f59e0b')('  ◈ Instinct Mode ACTIVATED\n')
              : chalk.gray('  Instinct Mode deactivated\n')
          );
          break;

        case 'method':
        case 'm':
          const newMethod = args[0]?.toLowerCase() as Methodology;
          if (newMethod && METHODOLOGIES[newMethod]) {
            config.methodology = newMethod;
            const m = METHODOLOGIES[newMethod];
            console.log(`  ${m.color(m.symbol)} Switched to ${chalk.white(newMethod)}\n`);
          } else {
            console.log(chalk.red('  Invalid methodology. Use: auto, direct, cod, bot, react, pot, gtp\n'));
          }
          break;

        case 'status':
          const m = METHODOLOGIES[config.methodology];
          console.log(`
${chalk.bold('AKHAI Status')}
  Model:      ${chalk.white(config.model)}
  Methodology: ${m.color(m.symbol)} ${chalk.white(config.methodology)}
  Instinct:   ${config.instinctMode ? chalk.hex('#f59e0b')('ON') : chalk.gray('OFF')}
  History:    ${chalk.white(history.length)} messages
  API:        ${config.apiKey ? chalk.green('●') : chalk.red('●')} ${config.apiKey ? 'Connected' : 'No API key'}
`);
          break;

        case 'history':
          if (commandHistory.length === 0) {
            console.log(chalk.gray('  No command history\n'));
          } else {
            console.log(chalk.bold('\nCommand History'));
            commandHistory.forEach((cmd, i) => {
              console.log(chalk.gray(`  ${i + 1}. `) + cmd);
            });
            console.log();
          }
          break;

        case 'export':
          const exported = history.map(h => `${h.role}: ${h.content}`).join('\n\n');
          console.log(chalk.gray('---\n') + exported + chalk.gray('\n---'));
          console.log(chalk.gray('  (Copy the above to save)\n'));
          break;

        case 'exit':
        case 'quit':
        case 'q':
          console.log(chalk.gray('\n  Goodbye.\n'));
          rl.close();
          process.exit(0);

        default:
          console.log(chalk.red(`  Unknown command: ${cmd}\n`));
      }
      
      prompt();
      return;
    }

    // Send to AI
    const spinner = ora({
      text: config.instinctMode ? 'Instinct processing...' : 'Thinking...',
      spinner: 'dots',
    }).start();

    try {
      const response = await queryAI(trimmed, config, history);
      spinner.stop();
      
      // Add to history
      history.push({ role: 'user', content: trimmed });
      history.push({ role: 'assistant', content: response });

      // Display response
      console.log();
      console.log(chalk.white(response));
      console.log();
    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
    }

    prompt();
  };

  prompt();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE QUERY MODE  
// ═══════════════════════════════════════════════════════════════════════════════

async function singleQuery(query: string, config: Config) {
  console.log(MINI_BANNER);
  
  const m = METHODOLOGIES[config.methodology];
  const instinct = config.instinctMode ? chalk.hex('#f59e0b')(' ◈') : '';
  console.log(chalk.gray('  ') + m.color(m.symbol) + ' ' + m.name + instinct + '\n');

  const spinner = ora({
    text: 'Processing...',
    spinner: 'dots',
  }).start();

  try {
    const response = await queryAI(query, config);
    spinner.stop();
    console.log(chalk.white(response));
    console.log();
  } catch (error) {
    spinner.stop();
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const program = new Command();

program
  .name('akhai')
  .description('AKHAI Terminal - Sovereign AI Intelligence')
  .version(VERSION)
  .option('-m, --method <methodology>', 'Methodology (auto, direct, cod, bot, react, pot, gtp)', 'auto')
  .option('-i, --instinct', 'Enable Instinct Mode')
  .option('--model <model>', 'AI model to use')
  .argument('[query]', 'Query to send (omit for interactive mode)')
  .action(async (query, options) => {
    const config = loadConfig();
    
    // Apply CLI options
    if (options.method) {
      config.methodology = options.method as Methodology;
    }
    if (options.instinct) {
      config.instinctMode = true;
    }
    if (options.model) {
      config.model = options.model;
    }

    if (query) {
      await singleQuery(query, config);
    } else {
      await interactiveMode(config);
    }
  });

program
  .command('status')
  .description('Show system status')
  .action(() => {
    const config = loadConfig();
    console.log(MINI_BANNER);
    console.log(`
${chalk.bold('System Status')}
  API Key:     ${config.apiKey ? chalk.green('●') + ' Set' : chalk.red('●') + ' Missing'}
  Model:       ${chalk.white(config.model)}
  Methodology: ${chalk.white(config.methodology)}
  Instinct:    ${config.instinctMode ? chalk.hex('#f59e0b')('ON') : chalk.gray('OFF')}
  Endpoint:    ${chalk.gray(config.endpoint)}

${chalk.bold('Environment Variables')}
  ANTHROPIC_API_KEY    Your Anthropic API key
  AKHAI_MODEL          Model override
  AKHAI_METHODOLOGY    Default methodology
  AKHAI_INSTINCT       Set to 'true' for default instinct mode
`);
  });

program
  .command('config')
  .description('Configure AKHAI')
  .action(async () => {
    console.log(MINI_BANNER);
    console.log(`
${chalk.bold('Configuration')}

Set these environment variables:

${chalk.cyan('export ANTHROPIC_API_KEY="sk-..."')}
${chalk.gray('# Get your key from console.anthropic.com')}

${chalk.cyan('export AKHAI_MODEL="claude-3-5-sonnet-20241022"')}
${chalk.gray('# Options: claude-3-5-sonnet-20241022, claude-3-opus-20240229')}

${chalk.cyan('export AKHAI_METHODOLOGY="auto"')}
${chalk.gray('# Options: auto, direct, cod, bot, react, pot, gtp')}

${chalk.cyan('export AKHAI_INSTINCT="true"')}
${chalk.gray('# Enable Instinct Mode by default')}

Add to your ~/.zshrc or ~/.bashrc for persistence.
`);
  });

program.parse();
