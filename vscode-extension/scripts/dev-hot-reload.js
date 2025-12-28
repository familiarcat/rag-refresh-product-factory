#!/usr/bin/env node

/**
 * Hot Reload Development Script
 *
 * Watches extension source files and automatically:
 * - Recompiles TypeScript
 * - Packages extension
 * - Triggers VS Code reload
 *
 * Usage: npm run dev:hot
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const DEBOUNCE_DELAY = 500; // ms
const RELOAD_COMMAND = `osascript -e 'tell application "Visual Studio Code" to activate' -e 'tell application "System Events" to keystroke "r" using {command down, shift down}'`;

let compileTimeout = null;
let isCompiling = false;
let changeQueue = new Set();

/**
 * Compile TypeScript
 */
function compile() {
  return new Promise((resolve, reject) => {
    logInfo('Compiling TypeScript...');
    isCompiling = true;

    const tsc = spawn('npx', ['tsc', '-p', './'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
    });

    let stderr = '';

    tsc.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    tsc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    tsc.on('close', (code) => {
      isCompiling = false;
      if (code === 0) {
        logSuccess('Compilation successful');
        resolve();
      } else {
        logError(`Compilation failed with code ${code}`);
        if (stderr) {
          console.error(stderr);
        }
        reject(new Error(`TypeScript compilation failed`));
      }
    });
  });
}

/**
 * Package extension
 */
function packageExtension() {
  return new Promise((resolve, reject) => {
    logInfo('Packaging extension...');

    const vsce = spawn('npx', ['vsce', 'package', '--no-dependencies'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
    });

    vsce.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('DONE')) {
        logSuccess('Extension packaged');
      }
    });

    vsce.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    vsce.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        logError(`Packaging failed with code ${code}`);
        reject(new Error(`Extension packaging failed`));
      }
    });
  });
}

/**
 * Trigger VS Code reload (macOS only)
 */
function triggerVSCodeReload() {
  logInfo('Triggering VS Code reload...');

  exec(RELOAD_COMMAND, (error) => {
    if (error) {
      logWarning('Could not auto-reload VS Code. Press Cmd+Shift+R manually.');
    } else {
      logSuccess('VS Code reload triggered (Cmd+Shift+R)');
    }
  });
}

/**
 * Full rebuild process
 */
async function rebuild(changedFiles) {
  if (isCompiling) {
    logWarning('Compilation already in progress, queuing...');
    return;
  }

  try {
    const fileList = Array.from(changedFiles).join(', ');
    log(`🔄 Rebuilding due to changes: ${fileList}`, 'yellow');

    // Step 1: Compile
    await compile();

    // Step 2: Package
    await packageExtension();

    // Step 3: Notify user
    logSuccess('Hot reload complete!');
    console.log('');
    logInfo('To apply changes:');
    console.log(`  ${colors.bright}1.${colors.reset} Press ${colors.cyan}Cmd+Shift+P${colors.reset} in VS Code`);
    console.log(`  ${colors.bright}2.${colors.reset} Type ${colors.cyan}"Developer: Reload Window"${colors.reset}`);
    console.log(`  ${colors.bright}3.${colors.reset} Or run: ${colors.cyan}npm run install-extension${colors.reset}`);
    console.log('');

    // Optional: Try to auto-reload VS Code (macOS only)
    if (process.platform === 'darwin') {
      setTimeout(() => {
        triggerVSCodeReload();
      }, 1000);
    }

    changeQueue.clear();
  } catch (error) {
    logError(`Rebuild failed: ${error.message}`);
  }
}

/**
 * Debounced rebuild
 */
function scheduleRebuild(filename) {
  changeQueue.add(path.basename(filename));

  if (compileTimeout) {
    clearTimeout(compileTimeout);
  }

  compileTimeout = setTimeout(() => {
    rebuild(changeQueue);
  }, DEBOUNCE_DELAY);
}

/**
 * Watch source files
 */
function watchFiles() {
  logInfo(`Watching ${SRC_DIR} for changes...`);

  fs.watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Ignore non-TypeScript files
    if (!filename.endsWith('.ts')) return;

    // Ignore certain files
    if (filename.includes('node_modules') || filename.includes('.git')) {
      return;
    }

    log(`File ${eventType}: ${filename}`, 'blue');
    scheduleRebuild(filename);
  });

  logSuccess('File watcher started');
}

/**
 * Main entry point
 */
async function main() {
  console.log('');
  log('🚀 Alex AI Extension - Hot Reload Dev Mode', 'bright');
  console.log('');

  // Initial build
  try {
    await rebuild(new Set(['Initial build']));
  } catch (error) {
    logError('Initial build failed. Fix errors and save a file to rebuild.');
  }

  // Start watching
  watchFiles();

  console.log('');
  logInfo('Hot reload is active. Edit any .ts file to trigger rebuild.');
  logWarning('Press Ctrl+C to stop');
  console.log('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  logInfo('Shutting down hot reload...');
  process.exit(0);
});

// Start
main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
