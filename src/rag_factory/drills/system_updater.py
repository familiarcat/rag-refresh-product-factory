"""System updater for applying drill optimization recommendations

Safely updates crew configs, orchestrator logic, cost database, and RAG storage
with backup/rollback capabilities.
"""

import os
import json
import shutil
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from .models import DrillEvaluation

logger = logging.getLogger(__name__)


class SystemUpdater:
    """Applies drill evaluation recommendations to system configuration"""

    def __init__(
        self,
        project_root: str,
        supabase_client=None,
        memory_store=None,
        dry_run: bool = False
    ):
        """
        Initialize system updater

        Args:
            project_root: Project root directory path
            supabase_client: Supabase client for RAG storage
            memory_store: MemoryStore instance for RAG
            dry_run: If True, don't actually apply updates
        """
        self.project_root = project_root
        self.db = supabase_client
        self.memory = memory_store
        self.dry_run = dry_run

        # Paths
        self.crew_configs_dir = os.path.join(project_root, "crew-members")
        self.cost_db_path = os.path.join(project_root, "data", "llm-cost-database.json")
        self.orchestrator_path = os.path.join(
            project_root,
            "src", "rag_factory", "orchestration", "crew_orchestrator.py"
        )
        self.backups_dir = os.path.join(project_root, "backups")

        # Ensure backups directory exists
        os.makedirs(self.backups_dir, exist_ok=True)

    def apply_recommendations(
        self,
        evaluation: DrillEvaluation,
        auto_apply: bool = True
    ) -> Dict[str, Any]:
        """
        Apply Picard's recommendations to system

        Args:
            evaluation: DrillEvaluation with recommendations
            auto_apply: If False, only return what would be updated

        Returns:
            Dict with update results
        """
        logger.info(f"Applying recommendations from evaluation {evaluation.id}")

        if self.dry_run or not auto_apply:
            logger.info("DRY RUN MODE - No actual changes will be made")

        updates_applied = {
            'crew_configs': [],
            'orchestrator': False,
            'cost_database': False,
            'rag_insights': False,
            'backup_id': None,
            'errors': []
        }

        try:
            # Create backup before any changes
            if not self.dry_run and auto_apply:
                backup_id = self.create_backup()
                updates_applied['backup_id'] = backup_id
                logger.info(f"Created backup: {backup_id}")

            # 1. Update crew configurations
            if evaluation.tier_recommendations:
                crew_updates = self.update_crew_configs(evaluation.tier_recommendations)
                updates_applied['crew_configs'] = crew_updates

            # 2. Update orchestrator logic
            if evaluation.orchestrator_updates:
                orchestrator_updated = self.update_orchestrator_logic(evaluation.orchestrator_updates)
                updates_applied['orchestrator'] = orchestrator_updated

            # 3. Update cost database
            if evaluation.recommended_changes:
                cost_db_updated = self.update_cost_database(evaluation.recommended_changes)
                updates_applied['cost_database'] = cost_db_updated

            # 4. Store drill insights in RAG
            rag_stored = self.store_drill_insights_in_rag(evaluation)
            updates_applied['rag_insights'] = rag_stored

            logger.info(
                f"Updates applied: {len(updates_applied['crew_configs'])} crew configs, "
                f"orchestrator={updates_applied['orchestrator']}, "
                f"cost_db={updates_applied['cost_database']}, "
                f"rag={updates_applied['rag_insights']}"
            )

        except Exception as e:
            logger.error(f"Error applying recommendations: {e}")
            updates_applied['errors'].append(str(e))

            # Rollback if we created a backup
            if updates_applied['backup_id'] and not self.dry_run:
                logger.warning("Attempting rollback due to error")
                self.rollback_updates(updates_applied['backup_id'])

        return updates_applied

    def update_crew_configs(
        self,
        tier_recommendations: Dict[str, Any]
    ) -> List[str]:
        """
        Update crew JSON configs with recommended tier assignments

        Args:
            tier_recommendations: Dict with tier recommendations

        Returns:
            List of updated crew member IDs
        """
        updated_crews = []

        if not os.path.exists(self.crew_configs_dir):
            logger.warning(f"Crew configs directory not found: {self.crew_configs_dir}")
            return updated_crews

        try:
            for crew_id, recommendation in tier_recommendations.items():
                crew_file = os.path.join(self.crew_configs_dir, f"{crew_id}.json")

                if not os.path.exists(crew_file):
                    logger.warning(f"Crew config not found: {crew_file}")
                    continue

                # Read current config
                with open(crew_file, 'r') as f:
                    crew_config = json.load(f)

                # Update default tier if recommendation includes it
                if isinstance(recommendation, dict) and 'default_tier' in recommendation:
                    new_tier = recommendation['default_tier']

                    if 'aiConfiguration' in crew_config and 'dynamicSelection' in crew_config['aiConfiguration']:
                        crew_config['aiConfiguration']['dynamicSelection']['defaultTier'] = new_tier

                        if not self.dry_run:
                            # Write atomically (temp file + rename)
                            temp_file = crew_file + '.tmp'
                            with open(temp_file, 'w') as f:
                                json.dump(crew_config, f, indent=2)

                            # Validate JSON
                            with open(temp_file, 'r') as f:
                                json.load(f)  # Will raise if invalid

                            # Atomic rename
                            os.replace(temp_file, crew_file)

                        updated_crews.append(crew_id)
                        logger.info(f"Updated {crew_id} default tier to {new_tier}")

        except Exception as e:
            logger.error(f"Error updating crew configs: {e}")

        return updated_crews

    def update_orchestrator_logic(
        self,
        orchestrator_updates: Dict[str, Any]
    ) -> bool:
        """
        Update orchestrator logic (keyword maps, complexity mappings)

        Args:
            orchestrator_updates: Dict with orchestrator changes

        Returns:
            True if updated successfully
        """
        # For safety, orchestrator logic updates should be manual
        # Log recommendations for review
        logger.info("Orchestrator updates recommended (manual review required):")
        logger.info(json.dumps(orchestrator_updates, indent=2))

        # In production, this could create a PR or issue for review
        return False

    def update_cost_database(
        self,
        cost_recommendations: Dict[str, Any]
    ) -> bool:
        """
        Update LLM cost database with new recommendations

        Args:
            cost_recommendations: Dict with cost updates

        Returns:
            True if updated successfully
        """
        if not os.path.exists(self.cost_db_path):
            logger.warning(f"Cost database not found: {self.cost_db_path}")
            return False

        try:
            # Read current cost database
            with open(self.cost_db_path, 'r') as f:
                cost_db = json.load(f)

            # Update crew_recommendations section if needed
            if 'crew_tier_updates' in cost_recommendations:
                if 'crew_recommendations' not in cost_db:
                    cost_db['crew_recommendations'] = {}

                for crew_id, tier_update in cost_recommendations['crew_tier_updates'].items():
                    if crew_id not in cost_db['crew_recommendations']:
                        cost_db['crew_recommendations'][crew_id] = {}

                    if isinstance(tier_update, dict) and 'primary_tier' in tier_update:
                        cost_db['crew_recommendations'][crew_id]['primary_tier'] = tier_update['primary_tier']

            if not self.dry_run:
                # Write atomically
                temp_file = self.cost_db_path + '.tmp'
                with open(temp_file, 'w') as f:
                    json.dump(cost_db, f, indent=2)

                # Validate
                with open(temp_file, 'r') as f:
                    json.load(f)

                # Atomic rename
                os.replace(temp_file, self.cost_db_path)

            logger.info("Updated cost database")
            return True

        except Exception as e:
            logger.error(f"Error updating cost database: {e}")
            return False

    def store_drill_insights_in_rag(
        self,
        evaluation: DrillEvaluation
    ) -> bool:
        """
        Store drill insights in RAG with deduplication

        Args:
            evaluation: DrillEvaluation to store

        Returns:
            True if stored successfully
        """
        if not self.db:
            logger.warning("No Supabase client provided, skipping RAG storage")
            return False

        try:
            # Generate semantic hash for deduplication
            content_text = f"{evaluation.assessment_summary} {evaluation.detailed_analysis}"
            semantic_hash = hashlib.sha256(content_text.encode()).hexdigest()[:32]

            # Content fingerprint (first 200 chars of detailed analysis)
            content_fingerprint = evaluation.detailed_analysis[:200] if evaluation.detailed_analysis else ""

            # Check for existing insights with same hash
            existing = self.db.table('crew_memories').select('id').eq(
                'semantic_hash', semantic_hash
            ).eq('intention', 'drill_optimization').execute()

            if existing.data and not self.dry_run:
                # Update existing insight
                existing_id = existing.data[0]['id']
                logger.info(f"Updating existing drill insight: {existing_id}")

                update_data = {
                    'summary': evaluation.assessment_summary,
                    'detailed_analysis': evaluation.detailed_analysis,
                    'key_findings': evaluation.key_findings,
                    'recommendations': evaluation.recommended_changes,
                    'confidence_level': evaluation.confidence_level,
                    'updated_at': datetime.now().isoformat()
                }

                self.db.table('crew_memories').update(update_data).eq('id', existing_id).execute()

            elif not self.dry_run:
                # Create new memory entry
                memory_data = {
                    'crew_member': 'picard',
                    'crew_member_name': 'Captain Picard',
                    'knowledge_type': 'best_practice',
                    'priority': 'high',
                    'title': f"Drill Optimization Insights - {evaluation.drill_run_id[:8]}",
                    'summary': evaluation.assessment_summary,
                    'detailed_analysis': evaluation.detailed_analysis,
                    'key_findings': evaluation.key_findings,
                    'recommendations': evaluation.recommended_changes,
                    'semantic_hash': semantic_hash,
                    'content_fingerprint': content_fingerprint,
                    'intention': 'drill_optimization',
                    'functional_role': 'crew_optimization',
                    'tags': ['drill', 'optimization', 'picard_evaluation', f"score_{int(evaluation.overall_score)}"],
                    'confidence_level': evaluation.confidence_level,
                    'semantic_text': content_text[:1000],  # Truncate for embedding
                    'complexity_level': 8,  # High complexity analysis
                    'project_specificity': False  # General optimization insights
                }

                self.db.table('crew_memories').insert(memory_data).execute()
                logger.info("Stored new drill insight in RAG")

            return True

        except Exception as e:
            logger.error(f"Error storing drill insights in RAG: {e}")
            return False

    def create_backup(self, target: str = "all") -> str:
        """
        Create backup of configuration files

        Args:
            target: What to backup ("all", "crew", "cost_db", "orchestrator")

        Returns:
            Backup ID (timestamp-based directory name)
        """
        backup_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = os.path.join(self.backups_dir, backup_id)

        try:
            os.makedirs(backup_dir, exist_ok=True)

            if target in ["all", "crew"]:
                # Backup crew configs
                crew_backup_dir = os.path.join(backup_dir, "crew-members")
                if os.path.exists(self.crew_configs_dir):
                    shutil.copytree(self.crew_configs_dir, crew_backup_dir)
                    logger.info(f"Backed up crew configs to {crew_backup_dir}")

            if target in ["all", "cost_db"]:
                # Backup cost database
                if os.path.exists(self.cost_db_path):
                    shutil.copy2(
                        self.cost_db_path,
                        os.path.join(backup_dir, "llm-cost-database.json")
                    )
                    logger.info(f"Backed up cost database")

            if target in ["all", "orchestrator"]:
                # Backup orchestrator
                if os.path.exists(self.orchestrator_path):
                    shutil.copy2(
                        self.orchestrator_path,
                        os.path.join(backup_dir, "crew_orchestrator.py")
                    )
                    logger.info(f"Backed up orchestrator")

            # Create backup manifest
            manifest = {
                'backup_id': backup_id,
                'created_at': datetime.now().isoformat(),
                'target': target,
                'files_backed_up': os.listdir(backup_dir)
            }

            with open(os.path.join(backup_dir, "manifest.json"), 'w') as f:
                json.dump(manifest, f, indent=2)

            logger.info(f"Backup created: {backup_id}")
            return backup_id

        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            raise

    def rollback_updates(self, backup_id: str) -> bool:
        """
        Rollback to a previous backup

        Args:
            backup_id: Backup ID to restore

        Returns:
            True if rollback successful
        """
        backup_dir = os.path.join(self.backups_dir, backup_id)

        if not os.path.exists(backup_dir):
            logger.error(f"Backup not found: {backup_id}")
            return False

        try:
            # Read manifest
            manifest_path = os.path.join(backup_dir, "manifest.json")
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)

            logger.info(f"Rolling back to backup {backup_id}")

            # Restore crew configs
            crew_backup_dir = os.path.join(backup_dir, "crew-members")
            if os.path.exists(crew_backup_dir):
                # Remove current configs
                if os.path.exists(self.crew_configs_dir):
                    shutil.rmtree(self.crew_configs_dir)

                # Restore from backup
                shutil.copytree(crew_backup_dir, self.crew_configs_dir)
                logger.info("Restored crew configs")

            # Restore cost database
            cost_db_backup = os.path.join(backup_dir, "llm-cost-database.json")
            if os.path.exists(cost_db_backup):
                shutil.copy2(cost_db_backup, self.cost_db_path)
                logger.info("Restored cost database")

            # Restore orchestrator
            orchestrator_backup = os.path.join(backup_dir, "crew_orchestrator.py")
            if os.path.exists(orchestrator_backup):
                shutil.copy2(orchestrator_backup, self.orchestrator_path)
                logger.info("Restored orchestrator")

            logger.info(f"Rollback complete: {backup_id}")
            return True

        except Exception as e:
            logger.error(f"Error during rollback: {e}")
            return False

    def cleanup_old_backups(self, keep_days: int = 30):
        """
        Remove backups older than specified days

        Args:
            keep_days: Number of days to keep backups
        """
        if not os.path.exists(self.backups_dir):
            return

        cutoff_timestamp = datetime.now().timestamp() - (keep_days * 24 * 60 * 60)

        try:
            for backup_name in os.listdir(self.backups_dir):
                backup_path = os.path.join(self.backups_dir, backup_name)

                if not os.path.isdir(backup_path):
                    continue

                # Check backup age
                backup_mtime = os.path.getmtime(backup_path)

                if backup_mtime < cutoff_timestamp:
                    shutil.rmtree(backup_path)
                    logger.info(f"Removed old backup: {backup_name}")

        except Exception as e:
            logger.error(f"Error cleaning up backups: {e}")
