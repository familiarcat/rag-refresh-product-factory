import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const hasEnvLocal = fs.existsSync(envPath);

const required = ['N8N_WEBHOOK_URL', 'N8N_PROJECT_WEBHOOK_URL'];
const missing = required.filter(k => !process.env[k]);

console.log('— RAG Refresh Product Factory: env check —');
console.log('Project:', process.cwd());
console.log('.env.local present:', hasEnvLocal ? 'yes' : 'no');
for (const k of required) console.log(`${k}:`, process.env[k] ? '(set)' : '(missing)');

if (missing.length) {
  console.log('\nFix:');
  console.log('1) Copy the template:');
  console.log('   cp .env.local.example .env.local');
  console.log('2) Edit .env.local using KEY=value syntax (no hyphens).');
  console.log('3) Restart the dev server (CTRL+C then npm run dev).\n');
  process.exit(1);
} else {
  console.log('\nOK: required env vars are set.');
}
