#!/usr/bin/env node

/**
 * AKHAI CLI
 * 
 * Terminal interface for AKHAI Mother Base.
 * 
 * Usage:
 *   akhai chat              Start interactive chat
 *   akhai query "prompt"    Single query
 *   akhai status            Check Mother Base status
 *   akhai config            Configure endpoints
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
import { MotherBase, MOTHER_BASE_CONFIGS } from '@akhai/inference';

const VERSION = '0.1.0';

// ASCII Art Banner
const BANNER = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('🧠 AKHAI MOTHER BASE')}                                     ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Sovereign AI Intelligence')}                                 ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

// Configuration (loaded from env or config file)
interface Config {
  provider: 'local' | 'runpod' | 'together' | 'custom';
  endpoint?: string;
  apiKey?: string;
  model?: string;
}

function loadConfig(): Config {
  return {
    provider: (process.env.AKHAI_PROVIDER as Config['provider']) || 'local',
    endpoint: process.env.AKHAI_ENDPOINT || 'http://localhost:11434',
    apiKey: process.env.AKHAI_API_KEY,
    model: process.env.AKHAI_MODEL || 'llama3.1:70b',
  };
}

function createMotherBase(config: Config): MotherBase {
  switch (config.provider) {
    case 'local':
      return new MotherBase(MOTHER_BASE_CONFIGS.local);
    
    case 'runpod':
      if (!config.endpoint || !config.apiKey) {
        throw new Error('RunPod requires AKHAI_ENDPOINT and AKHAI_API_KEY');
      }
      return new MotherBase(MOTHER_BASE_CONFIGS.runpod(config.endpoint, config.apiKey));
    
    case 'together':
      if (!config.apiKey) {
        throw new Error('Together AI requires AKHAI_API_KEY');
      }
      return new MotherBase(MOTHER_BASE_CONFIGS.together(config.apiKey));
    
    case 'custom':
      if (!config.endpoint || !config.model) {
        throw new Error('Custom provider requires AKHAI_ENDPOINT and AKHAI_MODEL');
      }
      return new MotherBase({
        primary: {
          name: 'custom',
          baseUrl: config.endpoint,
          model: config.model,
          apiKey: config.apiKey,
          role: 'primary',
        },
      });
    
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ============================================================================
// COMMANDS
// ============================================================================

/**
 * Interactive Chat Mode
 */
async function chatCommand() {
  console.log(BANNER);
  console.log(chalk.gray('Type your message and press Enter. Type "exit" to quit.\n'));

  const config = loadConfig();
  const spinner = ora('Connecting to Mother Base...').start();

  try {
    const motherBase = createMotherBase(config);
    const initialized = await motherBase.initialize();
    
    if (!initialized) {
      spinner.fail('Failed to connect to Mother Base');
      console.log(chalk.yellow('\nTip: Make sure your AI endpoint is running.'));
      console.log(chalk.gray('For local Ollama: ollama serve'));
      console.log(chalk.gray('For RunPod: Set AKHAI_ENDPOINT and AKHAI_API_KEY'));
      process.exit(1);
    }
    
    spinner.succeed('Connected to Mother Base');
  } catch (error: any) {
    spinner.fail(`Connection failed: ${error.message}`);
    process.exit(1);
  }

  const motherBase = createMotherBase(config);
  const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question(chalk.green('\n🧠 You: '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log(chalk.cyan('\n👋 Goodbye!\n'));
        rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === 'clear') {
        conversationHistory.length = 0;
        console.log(chalk.yellow('🧹 Conversation cleared.'));
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'status') {
        const status = await motherBase.getStatus();
        console.log(chalk.cyan('\n📊 Status:'));
        console.log(`  Primary: ${status.primary.healthy ? '✅' : '❌'} ${status.primary.name}`);
        for (const advisor of status.advisors) {
          console.log(`  Advisor: ${advisor.healthy ? '✅' : '❌'} ${advisor.name}`);
        }
        prompt();
        return;
      }

      // Add user message to history
      conversationHistory.push({ role: 'user', content: trimmed });

      const spinner = ora('Thinking...').start();

      try {
        const response = await motherBase.chat(conversationHistory);
        spinner.stop();

        // Add assistant response to history
        conversationHistory.push({ role: 'assistant', content: response.content });

        console.log(chalk.blue('\n🤖 AKHAI:'), response.content);
        console.log(chalk.gray(`\n   [${response.latency}ms | ${response.usage.totalTokens} tokens]`));
      } catch (error: any) {
        spinner.fail(`Error: ${error.message}`);
      }

      prompt();
    });
  };

  prompt();
}

/**
 * Single Query Mode
 */
async function queryCommand(promptText: string, options: { consensus?: boolean; stream?: boolean }) {
  const config = loadConfig();
  const spinner = ora('Connecting...').start();

  try {
    const motherBase = createMotherBase(config);
    await motherBase.initialize();
    spinner.text = 'Thinking...';

    if (options.stream) {
      spinner.stop();
      process.stdout.write(chalk.blue('🤖 AKHAI: '));
      
      for await (const chunk of motherBase.stream(promptText)) {
        if (!chunk.done) {
          process.stdout.write(chunk.content);
        }
      }
      console.log('\n');
    } else {
      const response = await motherBase.query(promptText, { useConsensus: options.consensus });
      spinner.stop();

      console.log(chalk.blue('\n🤖 AKHAI:'), response.content);
      console.log(chalk.gray(`\n[${response.latency}ms | ${response.usage.totalTokens} tokens]`));
    }
  } catch (error: any) {
    spinner.fail(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Status Command
 */
async function statusCommand() {
  console.log(BANNER);

  const config = loadConfig();
  const spinner = ora('Checking status...').start();

  try {
    const motherBase = createMotherBase(config);
    const status = await motherBase.getStatus();
    spinner.stop();

    console.log(chalk.cyan('📊 Mother Base Status\n'));
    console.log(`  Provider: ${chalk.white(config.provider)}`);
    console.log(`  Endpoint: ${chalk.gray(config.endpoint)}`);
    console.log('');
    console.log(`  Primary Model:`);
    console.log(`    ${status.primary.healthy ? chalk.green('✅') : chalk.red('❌')} ${status.primary.name} (${status.primary.model})`);
    
    if (status.advisors.length > 0) {
      console.log('');
      console.log(`  Advisor Models:`);
      for (const advisor of status.advisors) {
        console.log(`    ${advisor.healthy ? chalk.green('✅') : chalk.red('❌')} ${advisor.name} (${advisor.model})`);
      }
    }
    console.log('');
  } catch (error: any) {
    spinner.fail(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Config Command
 */
function configCommand() {
  console.log(BANNER);
  console.log(chalk.cyan('⚙️  Configuration\n'));

  const config = loadConfig();

  console.log('Current settings (from environment variables):');
  console.log(`  AKHAI_PROVIDER: ${chalk.white(config.provider)}`);
  console.log(`  AKHAI_ENDPOINT: ${chalk.white(config.endpoint || 'not set')}`);
  console.log(`  AKHAI_API_KEY:  ${chalk.white(config.apiKey ? '***' + config.apiKey.slice(-4) : 'not set')}`);
  console.log(`  AKHAI_MODEL:    ${chalk.white(config.model || 'not set')}`);
  console.log('');

  console.log(chalk.yellow('To configure, set environment variables:\n'));
  console.log(chalk.gray('# For local Ollama:'));
  console.log('export AKHAI_PROVIDER=local');
  console.log('export AKHAI_ENDPOINT=http://localhost:11434');
  console.log('');
  console.log(chalk.gray('# For Together AI:'));
  console.log('export AKHAI_PROVIDER=together');
  console.log('export AKHAI_API_KEY=your-api-key');
  console.log('');
  console.log(chalk.gray('# For RunPod vLLM:'));
  console.log('export AKHAI_PROVIDER=runpod');
  console.log('export AKHAI_ENDPOINT=https://your-pod.runpod.ai');
  console.log('export AKHAI_API_KEY=your-api-key');
  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

const program = new Command();

program
  .name('akhai')
  .description('AKHAI Mother Base - Sovereign AI Terminal')
  .version(VERSION);

program
  .command('chat')
  .description('Start interactive chat with Mother Base')
  .action(chatCommand);

program
  .command('query <prompt>')
  .description('Send a single query to Mother Base')
  .option('-c, --consensus', 'Use multi-model consensus')
  .option('-s, --stream', 'Stream the response')
  .action(queryCommand);

program
  .command('status')
  .description('Check Mother Base connection status')
  .action(statusCommand);

program
  .command('config')
  .description('Show and configure settings')
  .action(configCommand);

// Default to chat if no command specified
if (process.argv.length === 2) {
  chatCommand();
} else {
  program.parse();
}
