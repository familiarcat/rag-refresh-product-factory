#!/usr/bin/env node

/**
 * Seed Personas into Supabase
 *
 * Inserts 13 personas (7 user + 6 developer) via REST API
 */

const SUPABASE_URL = "https://rpkkkbufdwxmjaerbhbn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwa2trYnVmZHd4bWphZXJiaGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4Njc5MywiZXhwIjoyMDY5NjYyNzkzfQ.tkpxFpJUTG_sfkmauc_E8XmFKp_gnAT4gBhnBaUZTMY";

const personas = [
  // User Personas (7)
  {
    name: 'End User',
    type: 'user',
    description: 'Primary consumer of the product seeking simplicity and ease of use',
    technical_level: 2,
    goals: ['Complete tasks quickly', 'Intuitive interface', 'Reliable performance'],
    pain_points: ['Complex interfaces', 'Slow software', 'Unclear instructions'],
    preferred_crew_member: 'troi'
  },
  {
    name: 'Power User',
    type: 'user',
    description: 'Experienced user leveraging advanced features for productivity',
    technical_level: 6,
    goals: ['Maximize productivity with shortcuts', 'Automate repetitive tasks', 'Deep feature integration'],
    pain_points: ['Limited customization', 'Missing power features', 'Slow workflows'],
    preferred_crew_member: 'troi'
  },
  {
    name: 'Administrator',
    type: 'user',
    description: 'Manages system settings, user access, and security',
    technical_level: 7,
    goals: ['Control user access', 'Monitor system health', 'Ensure security compliance'],
    pain_points: ['Complex admin panels', 'Lack of audit logs', 'Security vulnerabilities'],
    preferred_crew_member: 'worf'
  },
  {
    name: 'Content Creator',
    type: 'user',
    description: 'Creates and publishes content using the platform',
    technical_level: 4,
    goals: ['Easy content creation', 'Creative tools', 'Fast publishing workflow'],
    pain_points: ['Limited creative tools', 'Slow uploads', 'Poor editor UX'],
    preferred_crew_member: 'troi'
  },
  {
    name: 'Developer',
    type: 'user',
    description: 'Technical user integrating via APIs or building extensions',
    technical_level: 9,
    goals: ['Comprehensive API documentation', 'Reliable endpoints', 'Easy authentication'],
    pain_points: ['Poor API docs', 'Unreliable webhooks', 'Limited extensibility'],
    preferred_crew_member: 'uhura'
  },
  {
    name: 'Enterprise Decision Maker',
    type: 'user',
    description: 'Evaluates ROI, security, and compliance for enterprise adoption',
    technical_level: 3,
    goals: ['Proven ROI', 'Enterprise security', 'Compliance certifications'],
    pain_points: ['Unclear pricing', 'Security concerns', 'Vendor lock-in'],
    preferred_crew_member: 'quark'
  },
  {
    name: 'Domain Specialist',
    type: 'user',
    description: 'Expert in specific domain (legal, healthcare, etc.) using the tool',
    technical_level: 5,
    goals: ['Domain-specific features', 'Accurate terminology', 'Compliance with regulations'],
    pain_points: ['Generic features', 'Incorrect terminology', 'Non-compliant workflows'],
    preferred_crew_member: 'picard'
  },

  // Developer Personas (6)
  {
    name: 'Frontend Developer',
    type: 'developer',
    description: 'Builds user interfaces with React, TypeScript, and modern frameworks',
    technical_level: 8,
    goals: ['Clean component architecture', 'Responsive design', 'Accessibility compliance'],
    pain_points: ['Poor design system', 'Performance issues', 'Browser compatibility'],
    preferred_crew_member: 'troi'
  },
  {
    name: 'Backend Developer',
    type: 'developer',
    description: 'Builds APIs, databases, and server-side logic',
    technical_level: 9,
    goals: ['Scalable APIs', 'Efficient database queries', 'Clean architecture'],
    pain_points: ['Slow queries', 'Poor error handling', 'Unclear requirements'],
    preferred_crew_member: 'data'
  },
  {
    name: 'DevOps Engineer',
    type: 'developer',
    description: 'Manages infrastructure, CI/CD, monitoring, and deployments',
    technical_level: 8,
    goals: ['Reliable deployments', 'Infrastructure as code', 'Automated testing'],
    pain_points: ['Manual deployments', 'Poor monitoring', 'Configuration drift'],
    preferred_crew_member: 'la_forge'
  },
  {
    name: 'Full-Stack Developer',
    type: 'developer',
    description: 'Works across frontend, backend, and database layers',
    technical_level: 8,
    goals: ['End-to-end feature delivery', 'Full system understanding', 'Rapid prototyping'],
    pain_points: ['Fragmented codebase', 'Context switching', 'Deep specialization gaps'],
    preferred_crew_member: 'riker'
  },
  {
    name: 'Designer (UI/UX)',
    type: 'developer',
    description: 'Designs user experiences and visual interfaces',
    technical_level: 7,
    goals: ['User-centered design', 'Consistent design system', 'Accessible interfaces'],
    pain_points: ['Design-dev handoff friction', 'Inconsistent implementation', 'Accessibility gaps'],
    preferred_crew_member: 'troi'
  },
  {
    name: 'QA Engineer',
    type: 'developer',
    description: 'Tests software quality, finds bugs, ensures reliability',
    technical_level: 7,
    goals: ['Comprehensive test coverage', 'Automated testing', 'Early bug detection'],
    pain_points: ['Flaky tests', 'Poor test infrastructure', 'Late-stage bugs'],
    preferred_crew_member: 'worf'
  }
];

async function seedPersonas() {
  console.log('🌱 Seeding Personas...\n');

  let insertedCount = 0;
  let skippedCount = 0;

  for (const persona of personas) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/personas`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates'
        },
        body: JSON.stringify(persona)
      });

      if (response.ok || response.status === 409) {
        if (response.status === 409) {
          console.log(`⚠️  ${persona.name}: already exists (skipped)`);
          skippedCount++;
        } else {
          console.log(`✓ ${persona.name}: inserted`);
          insertedCount++;
        }
      } else {
        const error = await response.text();
        console.log(`✗ ${persona.name}: failed - ${error.substring(0, 60)}`);
      }
    } catch (error) {
      console.log(`✗ ${persona.name}: error - ${error.message}`);
    }
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   Inserted: ${insertedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total: ${insertedCount + skippedCount}/${personas.length}\n`);
}

seedPersonas().catch(console.error);
