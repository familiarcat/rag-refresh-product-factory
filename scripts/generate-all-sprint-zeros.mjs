#!/usr/bin/env node

/**
 * Generate Sprint 0 for all projects that don't have an active sprint
 */

const projectsToInitialize = [
  {
    id: 'proj_1765948227414_iw68yf',
    name: 'AI Writing Assistant',
    goals: [
      'Implement AI-powered content generation with GPT-4 integration',
      'Build rich text editor with formatting and markdown support',
      'Create template library for common writing scenarios',
      'Add grammar and style checking with real-time suggestions',
      'Implement user authentication and document management',
      'Develop export functionality to multiple formats (PDF, DOCX, HTML)'
    ]
  },
  {
    id: 'proj_1765948227482_u3gf4c',
    name: 'Feedback Widget',
    goals: [
      'Design embeddable feedback widget with customizable themes',
      'Implement screenshot capture and annotation tools',
      'Build feedback dashboard with categorization and filtering',
      'Create email notification system for new feedback',
      'Add sentiment analysis for automatic feedback prioritization',
      'Develop public roadmap integration to close the feedback loop'
    ]
  },
  {
    id: 'proj_1765948227502_1m0gpk',
    name: 'Code Review Automation',
    goals: [
      'Integrate with GitHub/GitLab for automatic PR analysis',
      'Build AI-powered code review using static analysis',
      'Implement custom rule engine for team-specific standards',
      'Create inline commenting system with suggested fixes',
      'Add security vulnerability scanning and reporting',
      'Develop team metrics dashboard for code quality trends'
    ]
  },
  {
    id: 'proj_alex_ai_self_dev',
    name: 'Alex AI Self-Development',
    goals: [
      'Implement self-learning system using crew collaboration patterns',
      'Build automated test generation from user interactions',
      'Create performance optimization engine using historical data',
      'Develop feature suggestion system based on usage analytics',
      'Implement continuous integration for self-improvement cycles',
      'Build knowledge graph for cross-domain learning enhancement'
    ]
  }
];

async function generateSprint0(project) {
  console.log(`\n🚀 Generating Sprint 0 for: ${project.name}`);
  console.log(`   Project ID: ${project.id}`);
  console.log(`   Goals: ${project.goals.length}`);

  try {
    const response = await fetch('http://localhost:3000/api/sprints/generate-sprint-zero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: project.id,
        projectName: project.name,
        goals: project.goals,
        autoActivate: true
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();

    console.log(`   ✅ Sprint created: ${result.sprint.name}`);
    console.log(`   📊 Stories: ${result.stories.length}`);
    console.log(`   🎯 Velocity target: ${result.sprint.velocity_target}`);
    console.log(`   👥 Crew members: ${Object.keys(result.crewWorkload).length}`);

    // Show crew distribution
    const crewStats = Object.entries(result.crewWorkload)
      .map(([crew, data]) => `${crew.split('_').map(w => w[0].toUpperCase()).join('')}: ${data.story_points}pts`)
      .join(', ');
    console.log(`   💪 Workload: ${crewStats}`);

    return result;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🎯 Sprint 0 Generation for All Projects');
  console.log('========================================\n');

  const results = [];
  const errors = [];

  for (const project of projectsToInitialize) {
    try {
      const result = await generateSprint0(project);
      results.push({ project: project.name, success: true, result });

      // Wait a bit between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      errors.push({ project: project.name, error: error.message });
    }
  }

  console.log('\n\n📈 Summary');
  console.log('==========');
  console.log(`✅ Successful: ${results.length}/${projectsToInitialize.length}`);
  console.log(`❌ Failed: ${errors.length}/${projectsToInitialize.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ project, error }) => {
      console.log(`   - ${project}: ${error}`);
    });
  }

  console.log('\n✨ Sprint 0 generation complete!');
}

main().catch(console.error);
