# Documentation Consolidation Notes

This file records the additive changes made to consolidate markdown documentation and reduce duplicate clutter while preserving all information.

## Actions taken

- Removed duplicate (identical): CREW_OBSERVATION_SESSION 2.md (archived at docs/.archive/duplicates/CREW_OBSERVATION_SESSION 2.md)
- Removed duplicate (identical): BIDIRECTIONAL_INTEGRATION_README 2.md (archived at docs/.archive/duplicates/BIDIRECTIONAL_INTEGRATION_README 2.md)
- Removed duplicate (identical): ALEX_AI_CRUD_STATUS 2.md (archived at docs/.archive/duplicates/ALEX_AI_CRUD_STATUS 2.md)
- Removed duplicate (identical): IMPLEMENTATION_SUMMARY 2.md (archived at docs/.archive/duplicates/IMPLEMENTATION_SUMMARY 2.md)
- Removed duplicate (identical): CRUD_AND_IMAGE_ANALYSIS 2.md (archived at docs/.archive/duplicates/CRUD_AND_IMAGE_ANALYSIS 2.md)
- Removed duplicate (identical): DEPLOYMENT 2.md (archived at docs/.archive/duplicates/DEPLOYMENT 2.md)
- Removed duplicate (identical): ALEX_AI_FILE_SYSTEM_SUMMARY 2.md (archived at docs/.archive/duplicates/ALEX_AI_FILE_SYSTEM_SUMMARY 2.md)
- Removed duplicate (identical): content/overview 2.md (archived at docs/.archive/duplicates/content/overview 2.md)
- Removed duplicate (identical): content/timeline 2.md (archived at docs/.archive/duplicates/content/timeline 2.md)
- Removed duplicate (identical): content/portfolio 2.md (archived at docs/.archive/duplicates/content/portfolio 2.md)
- Removed duplicate (identical): content/categories 2.md (archived at docs/.archive/duplicates/content/categories 2.md)
- Removed duplicate (identical): content/roadmap 2.md (archived at docs/.archive/duplicates/content/roadmap 2.md)
- Removed duplicate (identical): content/assumptions 2.md (archived at docs/.archive/duplicates/content/assumptions 2.md)
- Removed duplicate (identical): content/nextjs_product_factory_best_practices 2.md (archived at docs/.archive/duplicates/content/nextjs_product_factory_best_practices 2.md)
- Removed duplicate (identical): docs/INFRA_DEPLOY_PLAYBOOK 2.md (archived at docs/.archive/duplicates/docs/INFRA_DEPLOY_PLAYBOOK 2.md)
- Removed duplicate (identical): docs/DEV_CICD_PLAYBOOK 2.md (archived at docs/.archive/duplicates/docs/DEV_CICD_PLAYBOOK 2.md)
- Removed duplicate (identical): docs/COST_OPTIMIZED_CREW_SYSTEM 2.md (archived at docs/.archive/duplicates/docs/COST_OPTIMIZED_CREW_SYSTEM 2.md)
- Removed duplicate (identical): docs/MILESTONE_RAG_PLAYBOOK 2.md (archived at docs/.archive/duplicates/docs/MILESTONE_RAG_PLAYBOOK 2.md)
- Removed duplicate (identical): docs/PUSH_TO_GITHUB_STEPS 2.md (archived at docs/.archive/duplicates/docs/PUSH_TO_GITHUB_STEPS 2.md)
- Removed duplicate (identical): docs/UNIFIED_CICD_STEPS 2.md (archived at docs/.archive/duplicates/docs/UNIFIED_CICD_STEPS 2.md)
- Removed duplicate (identical): docs/BIDIRECTIONAL_INTEGRATION_GUIDE 2.md (archived at docs/.archive/duplicates/docs/BIDIRECTIONAL_INTEGRATION_GUIDE 2.md)
- Removed duplicate (identical): docs/UNIFIED_WORKFLOW_OVERVIEW 2.md (archived at docs/.archive/duplicates/docs/UNIFIED_WORKFLOW_OVERVIEW 2.md)
- Removed duplicate (identical): docs/INTEGRATION_QUICK_REFERENCE 2.md (archived at docs/.archive/duplicates/docs/INTEGRATION_QUICK_REFERENCE 2.md)
- Removed duplicate (identical): docs/APPLEBOY_ACTIONS_NOTES 2.md (archived at docs/.archive/duplicates/docs/APPLEBOY_ACTIONS_NOTES 2.md)
- Removed duplicate (different content): docs/COST_ANALYSIS 2.md (archived at docs/.archive/duplicates/docs/COST_ANALYSIS 2.md); review vs docs/COST_ANALYSIS.md
- Removed duplicate (identical): docs/CURSOR_MIGRATION 2.md (archived at docs/.archive/duplicates/docs/CURSOR_MIGRATION 2.md)
- Removed duplicate (different content): docs/CICD_SETUP 2.md (archived at docs/.archive/duplicates/docs/CICD_SETUP 2.md); review vs docs/CICD_SETUP.md
- Promoted: docs/VSCODE_SETUP 2.md -> docs/VSCODE_SETUP.md (canonical); original archived copy moved to canonical
- Removed duplicate (identical): docs/UNIFIED_MEMORY_SCHEMA 2.md (archived at docs/.archive/duplicates/docs/UNIFIED_MEMORY_SCHEMA 2.md)
- Removed duplicate (identical): docs/COLOR_THEORY_BRIEFING 2.md (archived at docs/.archive/duplicates/docs/COLOR_THEORY_BRIEFING 2.md)
- Removed duplicate (identical): milestones/2024-12-15-alex-ai-mcp-unified-system 2.md (archived at docs/.archive/duplicates/milestones/2024-12-15-alex-ai-mcp-unified-system 2.md)
- Removed duplicate (identical): vscode-extension/DEV_WORKFLOW 2.md (archived at docs/.archive/duplicates/vscode-extension/DEV_WORKFLOW 2.md)

## Where duplicates were preserved

- `docs/.archive/duplicates/` contains copies of every removed/relocated duplicate.

## New/updated files

- `README.md` was replaced with a unified entry point.
- `README_UNIFIED.md` is the same unified content (kept for review).
- `DOCS_INDEX.md` provides a complete inventory of `.md` docs.
- `DOCS_MERGE_NOTES.md` (this file).

## Alignment note: OpenRouter-only billing goal

This docs consolidation is intentionally scoped to **documentation and auditability**.
As you continue implementation work, keep the repo aligned to the goal of:
- **provider-agnostic** agent/crew orchestration, and
- **single billing gateway via OpenRouter** for all model calls.

See README → “LLM billing posture (OpenRouter-first)” for the operational rule of thumb.
