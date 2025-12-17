#!/usr/bin/env node

/**
 * Alex AI Memories Display Script
 * 
 * Displays crew memories from the RAG system.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../..');

const CREW_ICONS = {
  'captain_picard': '🎖️',
  'commander_riker': '⚡',
  'commander_data': '🤖',
  'geordi_la_forge': '🔧',
  'counselor_troi': '💭',
  'lieutenant_worf': '⚔️',
  'dr_crusher': '💊',
  'chief_obrien': '🛠️',
  'quark': '💰',
  'lieutenant_uhura': '📻',
};

const TYPE_COLORS = {
  'lesson': '\x1b[36m',    // Cyan
  'pattern': '\x1b[32m',   // Green
  'solution': '\x1b[33m',  // Yellow
  'warning': '\x1b[31m',   // Red
  'decision': '\x1b[35m',  // Magenta
};

const RESET = '\x1b[0m';

async function loadMemories() {
  const memoriesPath = path.join(ROOT_DIR, 'data', 'crew_memories.json');
  try {
    const content = await readFile(memoriesPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function formatCrewName(crewId) {
  return crewId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  const memories = await loadMemories();
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                                                               ║');
  console.log('║   🧠  ALEX AI CREW MEMORIES                                   ║');
  console.log('║                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // Group by crew member
  const byCrewMember = {};
  for (const memory of memories) {
    if (!byCrewMember[memory.crewId]) {
      byCrewMember[memory.crewId] = [];
    }
    byCrewMember[memory.crewId].push(memory);
  }
  
  // Display memories by crew member
  for (const [crewId, crewMemories] of Object.entries(byCrewMember)) {
    const icon = CREW_ICONS[crewId] || '🖖';
    const name = formatCrewName(crewId);
    
    console.log(`${icon} ${name}`);
    console.log('─'.repeat(60));
    
    for (const memory of crewMemories) {
      const typeColor = TYPE_COLORS[memory.type] || '';
      const typeLabel = `[${memory.type.toUpperCase()}]`.padEnd(12);
      
      console.log(`  ${typeColor}${typeLabel}${RESET} ${memory.content}`);
    }
    
    console.log('\n');
  }
  
  // Summary
  console.log('📊 SUMMARY');
  console.log('─'.repeat(60));
  console.log(`  Total Memories: ${memories.length}`);
  
  const typeCounts = {};
  for (const m of memories) {
    typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
  }
  
  for (const [type, count] of Object.entries(typeCounts)) {
    const color = TYPE_COLORS[type] || '';
    console.log(`  ${color}${type.padEnd(12)}${RESET}: ${count}`);
  }
  
  console.log('─'.repeat(60));
  console.log('\n');
}

main().catch(console.error);
