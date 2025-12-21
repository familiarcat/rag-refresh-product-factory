#!/usr/bin/env node
/**
 * Natural language deployment CLI for intelligent crew orchestration.
 *
 * Can be called from:
 * - Terminal: node scripts/cli/deploy-orchestration.mjs
 * - NPM: npm run deploy:orchestration
 * - Alex AI Chat: "@alex deploy orchestration to AWS"
 * - VS Code Command: "Alex AI: Deploy Orchestration"
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Parse natural language deployment commands
 */
function parseCommand(args) {
  const command = args.join(' ').toLowerCase();

  // Check for deployment request
  if (command.includes('deploy') || command.includes('push') || command.includes('ship')) {
    if (command.includes('orchestration') || command.includes('crew') || command.includes('picard')) {
      return 'deploy-orchestration';
    }
    if (command.includes('vscode') || command.includes('extension')) {
      return 'deploy-extension';
    }
    return 'deploy-orchestration'; // Default to orchestration
  }

  // Check for status request
  if (command.includes('status') || command.includes('check')) {
    return 'check-status';
  }

  // Check for help
  if (command.includes('help') || command.length === 0) {
    return 'help';
  }

  return 'deploy-orchestration'; // Default action
}

/**
 * Deploy orchestration system to AWS
 */
async function deployOrchestration() {
  log('\n🚀 Deploying Intelligent Crew Orchestration to AWS...', 'cyan');
  log('════════════════════════════════════════════════════════\n', 'cyan');

  const scriptPath = path.join(projectRoot, 'scripts/deploy-with-orchestration.sh');

  try {
    // Run deployment script
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for logs
      env: {
        ...process.env,
        FORCE_COLOR: '1' // Preserve colors
      }
    });

    console.log(stdout);
    if (stderr) console.error(stderr);

    log('\n✅ Deployment complete!', 'green');
    return { success: true, output: stdout };

  } catch (error) {
    log('\n❌ Deployment failed!', 'red');
    console.error(error.stdout || error.message);
    console.error(error.stderr || '');
    return { success: false, error: error.message };
  }
}

/**
 * Deploy VS Code extension
 */
async function deployExtension() {
  log('\n📦 Building and installing VS Code extension...', 'cyan');
  log('══════════════════════════════════════════════════════\n', 'cyan');

  try {
    // Build extension
    log('Step 1/2: Building extension...', 'yellow');
    const { stdout: buildOut } = await execAsync('npm run vscode:build', {
      cwd: projectRoot
    });
    console.log(buildOut);

    // Install extension
    log('\nStep 2/2: Installing extension...', 'yellow');
    const { stdout: installOut } = await execAsync('npm run vscode:install', {
      cwd: projectRoot
    });
    console.log(installOut);

    log('\n✅ VS Code extension deployed!', 'green');
    log('\nReload VS Code to activate the updated extension.', 'cyan');
    return { success: true };

  } catch (error) {
    log('\n❌ Extension deployment failed!', 'red');
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check deployment status
 */
async function checkStatus() {
  log('\n🔍 Checking deployment status...', 'cyan');
  log('═════════════════════════════════════\n', 'cyan');

  try {
    // Check AWS deployment
    log('🌐 Production (AWS):', 'blue');
    const { stdout } = await execAsync('curl -s https://rag.pbradygeorgen.com/api/health || echo "Offline"');
    const isOnline = !stdout.includes('Offline');

    if (isOnline) {
      log('  ✓ rag.pbradygeorgen.com is online', 'green');

      // Test orchestration endpoint
      try {
        const { stdout: orchestrateTest } = await execAsync(
          'curl -s -X POST https://rag.pbradygeorgen.com/api/crew/orchestrate -H "Content-Type: application/json" -d \'{"task":"test"}\''
        );
        const response = JSON.parse(orchestrateTest);
        if (response.success) {
          log('  ✓ Orchestration endpoint working', 'green');
          log(`  ✓ Activated crew: ${response.orchestration?.activatedCrew?.join(', ') || 'N/A'}`, 'green');
        }
      } catch (err) {
        log('  ⚠ Orchestration endpoint issue', 'yellow');
      }
    } else {
      log('  ✗ rag.pbradygeorgen.com is offline', 'red');
    }

    // Check local dev server
    log('\n💻 Local Development:', 'blue');
    try {
      await execAsync('curl -s http://localhost:3000/api/health');
      log('  ✓ localhost:3000 is running', 'green');
    } catch {
      log('  ✗ localhost:3000 is not running', 'yellow');
      log('    Run: npm run dev', 'cyan');
    }

    // Check VS Code extension
    log('\n📱 VS Code Extension:', 'blue');
    const extensionPath = path.join(
      process.env.HOME,
      '.vscode/extensions/alex-ai.alex-ai-assistant-1.0.0'
    );
    try {
      await execAsync(`test -d ${extensionPath}`);
      log('  ✓ Extension installed', 'green');
      log(`    Path: ${extensionPath}`, 'cyan');
    } catch {
      log('  ✗ Extension not installed', 'yellow');
      log('    Run: npm run vscode:build && npm run vscode:install', 'cyan');
    }

    log('');
    return { success: true };

  } catch (error) {
    log('\n❌ Status check failed!', 'red');
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Show help
 */
function showHelp() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  🚀 Intelligent Crew Orchestration Deployment CLI      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝\n', 'cyan');

  log('USAGE:', 'bright');
  log('  npm run deploy:orchestration', 'cyan');
  log('  node scripts/cli/deploy-orchestration.mjs [command]\n', 'cyan');

  log('COMMANDS:', 'bright');
  log('  deploy orchestration    Deploy to AWS (default)', 'cyan');
  log('  deploy extension        Build and install VS Code extension', 'cyan');
  log('  check status           Check deployment status', 'cyan');
  log('  help                   Show this help\n', 'cyan');

  log('NATURAL LANGUAGE:', 'bright');
  log('  You can also use natural language:', 'cyan');
  log('  • "deploy orchestration to AWS"', 'cyan');
  log('  • "push crew system"', 'cyan');
  log('  • "ship Picard and Quark"', 'cyan');
  log('  • "deploy vscode extension"', 'cyan');
  log('  • "check deployment status"\n', 'cyan');

  log('ALEX AI CHAT:', 'bright');
  log('  From VS Code Copilot Chat:', 'cyan');
  log('  @alex deploy orchestration to AWS', 'cyan');
  log('  @alex check deployment status\n', 'cyan');

  log('FEATURES DEPLOYED:', 'bright');
  log('  ✓ Picard strategic task analysis', 'green');
  log('  ✓ Quark cost optimization', 'green');
  log('  ✓ Selective crew activation', 'green');
  log('  ✓ LLM call batching (30-80% cost reduction)', 'green');
  log('  ✓ POST /api/crew/orchestrate endpoint', 'green');
  log('  ✓ POST /api/crew/execute endpoint\n', 'green');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const action = parseCommand(args);

  let result;

  switch (action) {
    case 'deploy-orchestration':
      result = await deployOrchestration();
      break;

    case 'deploy-extension':
      result = await deployExtension();
      break;

    case 'check-status':
      result = await checkStatus();
      break;

    case 'help':
    default:
      showHelp();
      result = { success: true };
      break;
  }

  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    log('\n❌ Unexpected error:', 'red');
    console.error(error);
    process.exit(1);
  });
}

export { deployOrchestration, deployExtension, checkStatus };
