#!/usr/bin/env node
/**
 * Webview Build Script
 *
 * Bundles React components for VSCode webview using esbuild.
 * Creates a self-contained IIFE bundle that can run in webview context.
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const isWatch = process.argv.includes('--watch');

const buildConfig = {
  entryPoints: [join(rootDir, 'src/webview/index.tsx')],
  bundle: true,
  outfile: join(rootDir, 'dist/webview/sprintTimeline.js'),
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: !isWatch,
  sourcemap: true,
  globalName: 'SprintTimelineApp',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js'
  },
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"'
  },
  // External modules - VSCode API is provided by extension host
  external: [],
  // Bundle React and ReactDOM
  mainFields: ['browser', 'module', 'main'],
  logLevel: 'info'
};

async function build() {
  try {
    if (isWatch) {
      console.log('🔍 Building webview in watch mode...');
      const context = await esbuild.context(buildConfig);
      await context.watch();
      console.log('✅ Watching for changes...');
    } else {
      console.log('📦 Building webview bundle...');
      const result = await esbuild.build(buildConfig);

      if (result.errors.length > 0) {
        console.error('❌ Build errors:', result.errors);
        process.exit(1);
      }

      if (result.warnings.length > 0) {
        console.warn('⚠️  Build warnings:', result.warnings);
      }

      console.log('✅ Webview bundle created successfully!');
      console.log(`   Output: ${buildConfig.outfile}`);

      // Log bundle size
      const fs = await import('fs');
      const stats = fs.statSync(buildConfig.outfile);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   Size: ${sizeKB} KB`);

      if (stats.size > 500 * 1024) {
        console.warn('⚠️  Bundle size exceeds 500KB target!');
      }
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
