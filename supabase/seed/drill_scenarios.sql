-- Seed Data: Baseline Drill Scenarios
-- Purpose: Provide 30 diverse test scenarios covering all complexity levels and crew specializations
-- Created: 2025-12-20

-- ============================================================================
-- CRITICAL COMPLEXITY SCENARIOS (High-stakes strategic decisions)
-- ============================================================================

INSERT INTO drill_scenarios (scenario_type, category, complexity_level, title, description, user_request, expected_expertise, success_criteria, tags)
VALUES
(
    'synthetic',
    'architecture',
    'critical',
    'Migrate monolithic API to microservices architecture',
    'Major architectural transformation requiring strategic planning, security review, and phased execution.',
    'We need to refactor our monolithic Node.js API into microservices to improve scalability and team autonomy. The system handles 10M requests/day and has 200+ endpoints.',
    ARRAY['strategy', 'architecture', 'infrastructure', 'devops', 'security'],
    '{"required_crew_min": 4, "required_crew_max": 7, "must_include": ["captain_picard", "lieutenant_worf"], "expected_cost_range": [0.03, 0.05]}'::jsonb,
    ARRAY['architecture', 'microservices', 'critical', 'high_stakes']
),
(
    'synthetic',
    'security',
    'critical',
    'Production security incident response',
    'Critical security breach requiring immediate containment, investigation, and remediation.',
    'We detected unauthorized access to our production database. Need immediate incident response, containment strategy, and recovery plan.',
    ARRAY['security', 'testing', 'reliability', 'infrastructure'],
    '{"required_crew_min": 3, "required_crew_max": 6, "must_include": ["lieutenant_worf"], "expected_cost_range": [0.025, 0.045]}'::jsonb,
    ARRAY['security', 'incident', 'critical', 'emergency']
),
(
    'benchmark',
    'strategy',
    'critical',
    'Evaluate ML platform adoption strategy',
    'Strategic decision on whether to build or buy ML infrastructure.',
    'We need to decide: build our own ML platform or adopt an existing solution (AWS SageMaker, Databricks, etc.). This affects 3-year roadmap and $5M+ budget.',
    ARRAY['strategy', 'leadership', 'ai_ml', 'analytics', 'business', 'roi'],
    '{"required_crew_min": 4, "required_crew_max": 6, "must_include": ["captain_picard", "commander_data", "quark"], "expected_cost_range": [0.035, 0.055]}'::jsonb,
    ARRAY['strategy', 'ml', 'critical', 'build_vs_buy']
);

-- ============================================================================
-- IMPORTANT COMPLEXITY SCENARIOS (Significant features or fixes)
-- ============================================================================

INSERT INTO drill_scenarios (scenario_type, category, complexity_level, title, description, user_request, expected_expertise, success_criteria, tags)
VALUES
(
    'synthetic',
    'feature',
    'important',
    'Implement real-time collaboration features',
    'Add WebSocket-based collaborative editing to the application.',
    'We need to add real-time collaborative editing similar to Google Docs. Users should see each other''s cursors and edits in real-time. Expect 1000+ concurrent users per document.',
    ARRAY['implementation', 'infrastructure', 'devops', 'performance'],
    '{"required_crew_min": 3, "required_crew_max": 5, "must_include": ["chief_obrien", "geordi_la_forge"], "expected_cost_range": [0.015, 0.03]}'::jsonb,
    ARRAY['feature', 'websockets', 'realtime', 'important']
),
(
    'synthetic',
    'performance',
    'important',
    'Optimize database query performance',
    'Critical performance issue affecting user experience.',
    'Our main dashboard query takes 8-12 seconds to load. Users are complaining. The query joins 6 tables and returns 50K rows. Need optimization strategy.',
    ARRAY['performance', 'diagnostics', 'implementation', 'debugging'],
    '{"required_crew_min": 2, "required_crew_max": 4, "must_include": ["dr_crusher"], "expected_cost_range": [0.01, 0.025]}'::jsonb,
    ARRAY['performance', 'database', 'optimization', 'important']
),
(
    'real_world',
    'bug_fix',
    'important',
    'Fix critical authentication bug in OAuth flow',
    'Users report being logged out randomly during OAuth authentication.',
    'Bug in OAuth2 authentication: users get 401 errors randomly when refreshing tokens. Affects 15% of login attempts. Need root cause analysis and fix.',
    ARRAY['implementation', 'debugging', 'security', 'testing'],
    '{"required_crew_min": 2, "required_crew_max": 4, "must_include": ["chief_obrien", "lieutenant_worf"], "expected_cost_range": [0.01, 0.02]}'::jsonb,
    ARRAY['bug', 'auth', 'oauth', 'important']
),
(
    'synthetic',
    'integration',
    'important',
    'Build integration with Salesforce API',
    'Create bidirectional sync between app and Salesforce CRM.',
    'We need to sync customer data between our app and Salesforce. Should handle webhooks for real-time updates, batch sync for large datasets, and conflict resolution.',
    ARRAY['apis', 'integration', 'documentation', 'implementation'],
    '{"required_crew_min": 3, "required_crew_max": 4, "must_include": ["lieutenant_uhura", "chief_obrien"], "expected_cost_range": [0.015, 0.025]}'::jsonb,
    ARRAY['integration', 'api', 'salesforce', 'important']
),
(
    'synthetic',
    'ux',
    'important',
    'Redesign onboarding flow for accessibility',
    'Current onboarding doesn''t meet WCAG 2.1 AA standards.',
    'Our onboarding flow fails accessibility audit. Need to redesign for keyboard navigation, screen readers, and color contrast while maintaining UX quality.',
    ARRAY['ux', 'design', 'accessibility', 'implementation'],
    '{"required_crew_min": 2, "required_crew_max": 4, "must_include": ["counselor_troi"], "expected_cost_range": [0.01, 0.02]}'::jsonb,
    ARRAY['ux', 'accessibility', 'a11y', 'important']
);

-- ============================================================================
-- ROUTINE COMPLEXITY SCENARIOS (Standard implementation tasks)
-- ============================================================================

INSERT INTO drill_scenarios (scenario_type, category, complexity_level, title, description, user_request, expected_expertise, success_criteria, tags)
VALUES
(
    'synthetic',
    'bug_fix',
    'routine',
    'Fix email validation bug in signup form',
    'Email validation regex rejects valid email addresses.',
    'Email validation is rejecting valid addresses with plus signs (e.g., user+tag@gmail.com). Need to fix the regex pattern.',
    ARRAY['implementation', 'debugging', 'coding'],
    '{"required_crew_min": 1, "required_crew_max": 3, "must_include": ["chief_obrien"], "expected_cost_range": [0.003, 0.01]}'::jsonb,
    ARRAY['bug', 'validation', 'routine', 'quick_fix']
),
(
    'benchmark',
    'implementation',
    'routine',
    'Add pagination to user list API endpoint',
    'Endpoint returns all users, causing performance issues.',
    'The GET /api/users endpoint returns all 10K users at once. Add cursor-based pagination with limit/offset support.',
    ARRAY['implementation', 'apis', 'coding'],
    '{"required_crew_min': 2, "required_crew_max": 3, "must_include": ["chief_obrien"], "expected_cost_range": [0.005, 0.015]}'::jsonb,
    ARRAY['api', 'pagination', 'routine', 'backend']
),
(
    'synthetic',
    'testing',
    'routine',
    'Add unit tests for payment processing module',
    'Payment module lacks test coverage (currently 15%).',
    'We need to add comprehensive unit tests for the payment processing module. Should cover success cases, edge cases, and error scenarios.',
    ARRAY['testing', 'security', 'implementation'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["lieutenant_worf"], "expected_cost_range": [0.005, 0.012]}'::jsonb,
    ARRAY['testing', 'unit_tests', 'routine', 'quality']
),
(
    'synthetic',
    'api',
    'routine',
    'Document REST API endpoints with OpenAPI spec',
    'API lacks comprehensive documentation.',
    'Generate OpenAPI 3.0 specification for our 50 REST endpoints. Include request/response schemas, authentication, and example requests.',
    ARRAY['documentation', 'apis', 'communication'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["lieutenant_uhura"], "expected_cost_range": [0.005, 0.012]}'::jsonb,
    ARRAY['documentation', 'api', 'openapi', 'routine']
),
(
    'real_world',
    'infrastructure',
    'routine',
    'Setup automated database backups to S3',
    'Need automated backup solution for production databases.',
    'Configure automated daily PostgreSQL backups to S3. Should include point-in-time recovery capability and retention policy (30 days).',
    ARRAY['infrastructure', 'devops', 'systems'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["geordi_la_forge"], "expected_cost_range": [0.005, 0.012]}'::jsonb,
    ARRAY['infrastructure', 'backup', 'routine', 'devops']
),
(
    'synthetic',
    'business',
    'routine',
    'Calculate and optimize AWS infrastructure costs',
    'Monthly AWS bill growing unexpectedly.',
    'Analyze current AWS spending ($15K/month), identify cost optimization opportunities, and recommend rightsizing strategies.',
    ARRAY['business', 'roi', 'cost', 'optimization', 'infrastructure'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["quark", "geordi_la_forge"], "expected_cost_range": [0.005, 0.015]}'::jsonb,
    ARRAY['cost', 'optimization', 'aws', 'routine']
),
(
    'synthetic',
    'analytics',
    'routine',
    'Build user activity dashboard with metrics',
    'Product team needs visibility into user engagement.',
    'Create analytics dashboard showing DAU, MAU, feature usage, and retention metrics. Use existing event tracking data.',
    ARRAY['ai_ml', 'analytics', 'ux', 'design'],
    '{"required_crew_min": 3, "required_crew_max": 4, "must_include": ["commander_data", "counselor_troi"], "expected_cost_range": [0.01, 0.02]}'::jsonb,
    ARRAY['analytics', 'dashboard', 'metrics', 'routine']
);

-- ============================================================================
-- TRIVIAL COMPLEXITY SCENARIOS (Simple queries or formatting)
-- ============================================================================

INSERT INTO drill_scenarios (scenario_type, category, complexity_level, title, description, user_request, expected_expertise, success_criteria, tags)
VALUES
(
    'synthetic',
    'formatting',
    'trivial',
    'Fix code formatting in authentication module',
    'Code doesn''t follow project style guide.',
    'The auth module files don''t follow our ESLint rules. Run prettier and fix linting errors.',
    ARRAY['implementation', 'coding'],
    '{"required_crew_min": 1, "required_crew_max": 2, "must_include": [], "expected_cost_range": [0.0003, 0.002]}'::jsonb,
    ARRAY['formatting', 'lint', 'trivial', 'cleanup']
),
(
    'benchmark',
    'documentation',
    'trivial',
    'Update README with new environment variables',
    'README missing documentation for new env vars.',
    'Add documentation for 5 new environment variables (STRIPE_KEY, SENDGRID_API_KEY, etc.) to the README.md file.',
    ARRAY['documentation', 'communication'],
    '{"required_crew_min": 1, "required_crew_max": 2, "must_include": [], "expected_cost_range": [0.0003, 0.001]}'::jsonb,
    ARRAY['documentation', 'readme', 'trivial', 'simple']
),
(
    'synthetic',
    'simple_query',
    'trivial',
    'Explain how JWT authentication works',
    'New team member needs understanding of auth flow.',
    'Can you explain how our JWT authentication works? What happens when a user logs in and how tokens are refreshed?',
    ARRAY['security', 'communication', 'documentation'],
    '{"required_crew_min": 1, "required_crew_max": 2, "must_include": [], "expected_cost_range": [0.0003, 0.0015]}'::jsonb,
    ARRAY['explanation', 'auth', 'trivial', 'learning']
),
(
    'synthetic',
    'ui',
    'trivial',
    'Change button color from blue to green',
    'Simple UI styling update per design team request.',
    'Update the primary CTA button color from #0066CC to #00CC66 across all pages.',
    ARRAY['ux', 'design'],
    '{"required_crew_min": 1, "required_crew_max": 2, "must_include": [], "expected_cost_range": [0.0003, 0.001]}'::jsonb,
    ARRAY['ui', 'styling', 'trivial', 'design']
),
(
    'real_world',
    'configuration',
    'trivial',
    'Add new CORS origin to API whitelist',
    'Need to allow requests from new frontend domain.',
    'Add https://app.newdomain.com to the CORS whitelist in the API configuration.',
    ARRAY['implementation', 'configuration'],
    '{"required_crew_min": 1, "required_crew_max": 2, "must_include": [], "expected_cost_range": [0.0003, 0.001]}'::jsonb,
    ARRAY['config', 'cors', 'trivial', 'api']
);

-- ============================================================================
-- MIXED COMPLEXITY SCENARIOS (Additional coverage)
-- ============================================================================

INSERT INTO drill_scenarios (scenario_type, category, complexity_level, title, description, user_request, expected_expertise, success_criteria, tags)
VALUES
(
    'synthetic',
    'ai_ml',
    'important',
    'Implement recommendation engine with collaborative filtering',
    'Build personalized product recommendations for e-commerce platform.',
    'Create a recommendation system using collaborative filtering. Should handle 100K users and 10K products, update daily, and serve recommendations in <100ms.',
    ARRAY['ai_ml', 'analytics', 'algorithms', 'performance'],
    '{"required_crew_min": 3, "required_crew_max": 5, "must_include": ["commander_data"], "expected_cost_range": [0.02, 0.035]}'::jsonb,
    ARRAY['ml', 'recommendations', 'important', 'ai']
),
(
    'real_world',
    'monitoring',
    'routine',
    'Setup application performance monitoring with Datadog',
    'Need visibility into production performance issues.',
    'Integrate Datadog APM to track request latency, error rates, and resource usage. Setup alerts for P95 latency > 500ms.',
    ARRAY['performance', 'diagnostics', 'monitoring', 'infrastructure'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["dr_crusher", "geordi_la_forge"], "expected_cost_range": [0.008, 0.015]}'::jsonb,
    ARRAY['monitoring', 'apm', 'routine', 'observability']
),
(
    'synthetic',
    'deployment',
    'important',
    'Migrate from Heroku to Kubernetes on AWS',
    'Cost and scalability requirements exceed Heroku capabilities.',
    'Plan and execute migration from Heroku to self-managed Kubernetes on AWS EKS. Zero-downtime migration required. Current: 20 dynos, 3 databases.',
    ARRAY['infrastructure', 'devops', 'cloud', 'systems', 'strategy'],
    '{"required_crew_min": 4, "required_crew_max": 5, "must_include": ["geordi_la_forge", "commander_riker"], "expected_cost_range": [0.025, 0.04]}'::jsonb,
    ARRAY['migration', 'kubernetes', 'important', 'infrastructure']
),
(
    'synthetic',
    'compliance',
    'important',
    'Implement GDPR data export and deletion features',
    'Need to comply with GDPR right to access and right to be forgotten.',
    'Build user data export (JSON format) and account deletion features. Should handle user data across 8 tables and 2 external services (Stripe, SendGrid).',
    ARRAY['implementation', 'security', 'documentation', 'ethical_guidance'],
    '{"required_crew_min": 3, "required_crew_max": 4, "must_include": ["chief_obrien", "lieutenant_worf"], "expected_cost_range": [0.015, 0.025]}'::jsonb,
    ARRAY['gdpr', 'compliance', 'important', 'privacy']
),
(
    'benchmark',
    'code_review',
    'routine',
    'Review pull request for new payment flow',
    'PR adds credit card payment processing via Stripe.',
    'Review this PR that adds Stripe payment integration: 250 lines of code across 5 files. Check for security issues, error handling, and test coverage.',
    ARRAY['security', 'testing', 'implementation', 'code_review'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["lieutenant_worf"], "expected_cost_range": [0.005, 0.012]}'::jsonb,
    ARRAY['code_review', 'security', 'routine', 'payments']
),
(
    'synthetic',
    'database',
    'routine',
    'Add database indexes to improve query performance',
    'Analytics queries are slow due to missing indexes.',
    'Analyze slow query log and add appropriate indexes. Top 3 slow queries: user activity summary (8s), product search (5s), order history (6s).',
    ARRAY['performance', 'implementation', 'database'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["dr_crusher", "chief_obrien"], "expected_cost_range": [0.005, 0.015]}'::jsonb,
    ARRAY['database', 'indexes', 'routine', 'performance']
),
(
    'synthetic',
    'frontend',
    'routine',
    'Implement dark mode theme toggle',
    'Users requesting dark mode option in settings.',
    'Add dark mode toggle to user settings. Should persist preference and apply theme across all pages. Use CSS variables for colors.',
    ARRAY['ux', 'design', 'implementation'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["counselor_troi"], "expected_cost_range": [0.008, 0.015]}'::jsonb,
    ARRAY['frontend', 'dark_mode', 'routine', 'ux']
),
(
    'real_world',
    'caching',
    'routine',
    'Add Redis caching layer for frequently accessed data',
    'Database load is high from repeated queries for same data.',
    'Implement Redis caching for user profiles and product catalog. Cache TTL: 15 minutes. Cache invalidation on updates.',
    ARRAY['performance', 'infrastructure', 'implementation'],
    '{"required_crew_min": 2, "required_crew_max": 3, "must_include": ["dr_crusher", "chief_obrien"], "expected_cost_range": [0.008, 0.015]}'::jsonb,
    ARRAY['caching', 'redis', 'routine', 'performance']
);

-- ============================================================================
-- Verification
-- ============================================================================

-- Count scenarios by complexity
SELECT
    complexity_level,
    COUNT(*) AS scenario_count
FROM drill_scenarios
GROUP BY complexity_level
ORDER BY
    CASE complexity_level
        WHEN 'critical' THEN 1
        WHEN 'important' THEN 2
        WHEN 'routine' THEN 3
        WHEN 'trivial' THEN 4
    END;

-- Display summary
SELECT
    '✅ Seed data inserted successfully' AS status,
    COUNT(*) AS total_scenarios,
    COUNT(DISTINCT category) AS unique_categories,
    COUNT(DISTINCT scenario_type) AS scenario_types
FROM drill_scenarios;
