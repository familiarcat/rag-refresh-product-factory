"""
Cost-Optimized Crew Orchestration System

Implements a hierarchical crew activation system:
1. Picard (Strategic Director) - Uses premium LLM to decide which crew members needed
2. Riker (Tactical Coordinator) - Assembles crew and coordinates execution
3. Quark (Cost Optimizer) - Analyzes ROI and recommends cost-efficient LLM assignments
4. Selected Crew - Activated with dynamically assigned LLMs based on task complexity

Flow:
User Request → Picard (Strategy) → Riker + Quark (ROI Analysis) → Minimal Crew Activation
"""

import json
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class TaskComplexity(Enum):
    """Task complexity levels for cost optimization"""
    CRITICAL = "critical"      # High-stakes strategic decisions
    IMPORTANT = "important"    # Significant features or fixes
    ROUTINE = "routine"        # Standard implementation tasks
    TRIVIAL = "trivial"        # Simple queries or formatting


class LLMTier(Enum):
    """LLM cost tiers"""
    PREMIUM = "premium"        # Highest capability ($0.0135+ per request)
    STANDARD = "standard"      # Good balance ($0.01 per request)
    BUDGET = "budget"          # Cost-efficient ($0.0016 per request)
    ULTRA_BUDGET = "ultra_budget"  # Minimal cost ($0.0003 per request)


@dataclass
class CrewMember:
    """Crew member configuration"""
    id: str
    name: str
    specialization: List[str]
    recommended_tier: LLMTier
    cost_per_request: float


@dataclass
class TaskAnalysis:
    """Picard's strategic analysis of the task"""
    complexity: TaskComplexity
    required_expertise: List[str]
    recommended_crew: List[str]
    reasoning: str
    estimated_crew_size: int


@dataclass
class ROIAnalysis:
    """Quark's ROI analysis"""
    total_cost_premium: float
    total_cost_optimized: float
    cost_savings: float
    savings_percentage: float
    crew_llm_assignments: Dict[str, str]
    recommendation: str


@dataclass
class OrchestrationResult:
    """Result of crew orchestration"""
    activated_crew: List[str]
    llm_assignments: Dict[str, str]
    task_complexity: TaskComplexity
    estimated_cost: float
    picard_reasoning: str
    quark_roi_analysis: ROIAnalysis


class CrewOrchestrator:
    """
    Orchestrates cost-optimized crew activation

    Workflow:
    1. Picard analyzes task → determines complexity & required crew
    2. Riker + Quark perform ROI analysis → optimize LLM selection
    3. Only necessary crew members are activated with cost-efficient LLMs
    """

    def __init__(self, cost_database_path: str = None):
        """
        Initialize orchestrator

        Args:
            cost_database_path: Path to LLM cost database JSON
        """
        if cost_database_path is None:
            # Default to project data directory
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            cost_database_path = os.path.join(project_root, "data", "llm-cost-database.json")

        self.cost_db = self._load_cost_database(cost_database_path)
        self.crew_roster = self._initialize_crew_roster()

    def _load_cost_database(self, path: str) -> Dict:
        """Load LLM cost database"""
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Cost database not found at {path}")
            return {}

    def _initialize_crew_roster(self) -> Dict[str, CrewMember]:
        """Initialize crew member roster with cost data"""
        roster = {}

        if not self.cost_db:
            return roster

        recommendations = self.cost_db.get("crew_recommendations", {})
        cost_calcs = self.cost_db.get("cost_calculations", {}).get("cost_per_request", {})

        crew_configs = {
            "captain_picard": {
                "name": "Captain Picard",
                "specialization": ["strategy", "leadership", "architecture", "ethics"]
            },
            "commander_riker": {
                "name": "Commander Riker",
                "specialization": ["tactical", "execution", "coordination", "workflow"]
            },
            "commander_data": {
                "name": "Commander Data",
                "specialization": ["ai_ml", "analytics", "algorithms", "automation"]
            },
            "geordi_la_forge": {
                "name": "Geordi La Forge",
                "specialization": ["infrastructure", "devops", "cloud", "systems"]
            },
            "counselor_troi": {
                "name": "Counselor Troi",
                "specialization": ["ux", "accessibility", "design", "user_experience"]
            },
            "lieutenant_worf": {
                "name": "Lt. Worf",
                "specialization": ["security", "testing", "reliability", "qa"]
            },
            "chief_obrien": {
                "name": "Chief O'Brien",
                "specialization": ["implementation", "debugging", "coding", "hands_on"]
            },
            "quark": {
                "name": "Quark",
                "specialization": ["business", "roi", "cost", "optimization"]
            },
            "dr_crusher": {
                "name": "Dr. Crusher",
                "specialization": ["performance", "diagnostics", "health", "monitoring"]
            },
            "lieutenant_uhura": {
                "name": "Lt. Uhura",
                "specialization": ["apis", "integration", "documentation", "communication"]
            }
        }

        for crew_id, config in crew_configs.items():
            recommendation = recommendations.get(crew_id, {})
            tier = recommendation.get("primary_tier", "standard")

            # Map tier to cost
            tier_cost_map = {
                "premium": cost_calcs.get("premium_mid", {}).get("cost_usd", 0.0135),
                "standard": cost_calcs.get("standard", {}).get("cost_usd", 0.01),
                "budget": cost_calcs.get("budget", {}).get("cost_usd", 0.001575),
                "ultra_budget": cost_calcs.get("ultra_budget", {}).get("cost_usd", 0.0003)
            }

            roster[crew_id] = CrewMember(
                id=crew_id,
                name=config["name"],
                specialization=config["specialization"],
                recommended_tier=LLMTier(tier),
                cost_per_request=tier_cost_map.get(tier, 0.01)
            )

        return roster

    def _picard_analyze_task(self, user_request: str, context: Optional[Dict] = None) -> TaskAnalysis:
        """
        Picard's strategic analysis of the task

        In a real implementation, this would call Picard's LLM.
        For now, implements rule-based logic.

        Args:
            user_request: The user's task description
            context: Optional context about the task

        Returns:
            TaskAnalysis with Picard's strategic assessment
        """
        # Keywords for complexity assessment
        critical_keywords = ["architecture", "refactor", "security incident", "production down", "critical bug"]
        important_keywords = ["feature", "bug", "performance", "optimization", "implement"]
        trivial_keywords = ["format", "typo", "simple", "quick", "minor"]

        request_lower = user_request.lower()

        # Determine complexity
        if any(kw in request_lower for kw in critical_keywords):
            complexity = TaskComplexity.CRITICAL
            max_crew = 7
        elif any(kw in request_lower for kw in important_keywords):
            complexity = TaskComplexity.IMPORTANT
            max_crew = 5
        elif any(kw in request_lower for kw in trivial_keywords):
            complexity = TaskComplexity.TRIVIAL
            max_crew = 2
        else:
            complexity = TaskComplexity.ROUTINE
            max_crew = 3

        # Map keywords to required expertise
        expertise_map = {
            "ai": ["ai_ml", "analytics"],
            "ml": ["ai_ml", "analytics"],
            "machine learning": ["ai_ml", "analytics"],
            "infrastructure": ["infrastructure", "devops"],
            "cloud": ["infrastructure", "devops"],
            "devops": ["infrastructure", "devops"],
            "ux": ["ux", "design"],
            "ui": ["ux", "design"],
            "design": ["ux", "design"],
            "security": ["security", "testing"],
            "test": ["security", "testing"],
            "api": ["apis", "integration"],
            "integration": ["apis", "integration"],
            "performance": ["performance", "diagnostics"],
            "bug": ["implementation", "debugging"],
            "implement": ["implementation", "coding"],
            "code": ["implementation", "coding"],
            "cost": ["business", "roi"],
            "budget": ["business", "roi"],
            "strategy": ["strategy", "leadership"],
            "architecture": ["strategy", "architecture"]
        }

        required_expertise = []
        for keyword, expertise in expertise_map.items():
            if keyword in request_lower:
                required_expertise.extend(expertise)

        # Remove duplicates
        required_expertise = list(set(required_expertise))

        # If no specific expertise found, default to tactical execution
        if not required_expertise:
            required_expertise = ["tactical", "execution"]

        # Always include Riker for coordination
        recommended_crew = ["commander_riker"]

        # Match crew members to required expertise
        for crew_id, member in self.crew_roster.items():
            if crew_id == "commander_riker":
                continue  # Already added

            # Check if crew member has any required expertise
            if any(exp in member.specialization for exp in required_expertise):
                recommended_crew.append(crew_id)

        # Limit crew size based on complexity
        recommended_crew = recommended_crew[:max_crew]

        # Generate reasoning
        reasoning = (
            f"Task complexity: {complexity.value}. "
            f"Required expertise: {', '.join(required_expertise)}. "
            f"Recommended {len(recommended_crew)} crew members for optimal efficiency. "
            f"Riker will coordinate tactical execution."
        )

        return TaskAnalysis(
            complexity=complexity,
            required_expertise=required_expertise,
            recommended_crew=recommended_crew,
            reasoning=reasoning,
            estimated_crew_size=len(recommended_crew)
        )

    def _quark_roi_analysis(
        self,
        task_analysis: TaskAnalysis,
        crew_members: List[str]
    ) -> ROIAnalysis:
        """
        Quark's ROI analysis and cost optimization

        Args:
            task_analysis: Picard's task analysis
            crew_members: List of crew member IDs to activate

        Returns:
            ROIAnalysis with cost optimization recommendations
        """
        # Calculate cost if all crew used premium LLMs
        premium_cost = sum(
            self.cost_db["cost_calculations"]["cost_per_request"]["premium_mid"]["cost_usd"]
            for _ in crew_members
        )

        # Optimize LLM selection based on task complexity and crew role
        llm_assignments = {}
        optimized_cost = 0.0

        complexity_tier_map = {
            TaskComplexity.CRITICAL: {
                "captain_picard": "premium",
                "commander_riker": "standard",
                "default": "standard"
            },
            TaskComplexity.IMPORTANT: {
                "captain_picard": "standard",
                "commander_riker": "standard",
                "default": "budget"
            },
            TaskComplexity.ROUTINE: {
                "captain_picard": "standard",
                "commander_riker": "budget",
                "default": "budget"
            },
            TaskComplexity.TRIVIAL: {
                "commander_riker": "budget",
                "default": "ultra_budget"
            }
        }

        tier_assignments = complexity_tier_map.get(
            task_analysis.complexity,
            {"default": "budget"}
        )

        cost_map = {
            "premium": self.cost_db["cost_calculations"]["cost_per_request"]["premium_mid"]["cost_usd"],
            "standard": self.cost_db["cost_calculations"]["cost_per_request"]["standard"]["cost_usd"],
            "budget": self.cost_db["cost_calculations"]["cost_per_request"]["budget"]["cost_usd"],
            "ultra_budget": self.cost_db["cost_calculations"]["cost_per_request"]["ultra_budget"]["cost_usd"]
        }

        for crew_id in crew_members:
            tier = tier_assignments.get(crew_id, tier_assignments["default"])
            llm_assignments[crew_id] = tier
            optimized_cost += cost_map[tier]

        cost_savings = premium_cost - optimized_cost
        savings_percentage = (cost_savings / premium_cost * 100) if premium_cost > 0 else 0

        recommendation = (
            f"Optimized crew activation saves ${cost_savings:.4f} ({savings_percentage:.1f}%) "
            f"compared to premium-only approach. "
            f"Total estimated cost: ${optimized_cost:.4f}"
        )

        return ROIAnalysis(
            total_cost_premium=premium_cost,
            total_cost_optimized=optimized_cost,
            cost_savings=cost_savings,
            savings_percentage=savings_percentage,
            crew_llm_assignments=llm_assignments,
            recommendation=recommendation
        )

    def orchestrate(
        self,
        user_request: str,
        context: Optional[Dict] = None,
        tier_override: Optional[Dict[str, str]] = None
    ) -> OrchestrationResult:
        """
        Orchestrate cost-optimized crew activation

        Workflow:
        1. Picard analyzes task → determines complexity & required crew
        2. Riker coordinates with Quark for ROI analysis
        3. Return optimized crew activation plan

        Args:
            user_request: The user's task request
            context: Optional context about the task
            tier_override: Optional dict mapping crew_id to tier (for drill testing)
                          If provided, bypasses Quark's ROI analysis

        Returns:
            OrchestrationResult with crew activation plan
        """
        # Step 1: Picard's strategic analysis
        logger.info("🎖️ Picard analyzing task...")
        task_analysis = self._picard_analyze_task(user_request, context)

        # Step 2: Quark's ROI analysis (coordinated by Riker)
        if tier_override:
            # Use tier override (for drill testing)
            logger.info("💰 Using tier override for drill testing...")
            llm_assignments = tier_override
            estimated_cost = self._calculate_cost_from_tiers(tier_override)

            # Create simplified ROI analysis
            roi_analysis = ROIAnalysis(
                total_cost_premium=estimated_cost * 1.5,  # Estimate
                total_cost_optimized=estimated_cost,
                cost_savings=estimated_cost * 0.5,
                savings_percentage=33.3,
                crew_llm_assignments=llm_assignments,
                recommendation=f"Using tier override for testing: ${estimated_cost:.4f}"
            )
        else:
            logger.info("💰 Riker coordinating with Quark for ROI analysis...")
            roi_analysis = self._quark_roi_analysis(task_analysis, task_analysis.recommended_crew)

        # Step 3: Assemble orchestration result
        result = OrchestrationResult(
            activated_crew=task_analysis.recommended_crew,
            llm_assignments=roi_analysis.crew_llm_assignments,
            task_complexity=task_analysis.complexity,
            estimated_cost=roi_analysis.total_cost_optimized,
            picard_reasoning=task_analysis.reasoning,
            quark_roi_analysis=roi_analysis
        )

        logger.info(
            f"✅ Orchestration complete: {len(result.activated_crew)} crew members, "
            f"${result.estimated_cost:.4f} estimated cost"
        )

        return result

    def _calculate_cost_from_tiers(self, tier_assignments: Dict[str, str]) -> float:
        """Calculate total cost from tier assignments"""
        cost_map = {
            "premium": self.cost_db["cost_calculations"]["cost_per_request"]["premium_mid"]["cost_usd"],
            "standard": self.cost_db["cost_calculations"]["cost_per_request"]["standard"]["cost_usd"],
            "budget": self.cost_db["cost_calculations"]["cost_per_request"]["budget"]["cost_usd"],
            "ultra_budget": self.cost_db["cost_calculations"]["cost_per_request"]["ultra_budget"]["cost_usd"]
        }

        total_cost = 0.0
        for crew_id, tier in tier_assignments.items():
            total_cost += cost_map.get(tier, cost_map["standard"])

        return total_cost

    def get_llm_config_for_crew(self, crew_id: str, tier: str) -> Dict:
        """
        Get LLM configuration for a crew member at a specific tier

        Args:
            crew_id: Crew member ID
            tier: LLM tier (premium, standard, budget, ultra_budget)

        Returns:
            Dict with model ID and configuration
        """
        tier_models = self.cost_db.get("tiers", {}).get(tier, {}).get("models", [])

        if not tier_models:
            # Fallback to standard
            tier_models = self.cost_db.get("tiers", {}).get("standard", {}).get("models", [])

        # Get first model in tier
        if tier_models:
            model = tier_models[0]
            return {
                "model_id": model["id"],
                "model_name": model["name"],
                "context_window": model["context_window"],
                "capabilities": model["capabilities"]
            }

        # Ultimate fallback
        return {
            "model_id": "openai/gpt-4o",
            "model_name": "GPT-4o",
            "context_window": 128000,
            "capabilities": ["general"]
        }


def example_usage():
    """Example usage of crew orchestrator"""
    orchestrator = CrewOrchestrator()

    # Example 1: Critical task
    print("\n" + "="*80)
    print("Example 1: Critical Architecture Decision")
    print("="*80)

    result = orchestrator.orchestrate(
        "We need to refactor our authentication architecture to support OAuth2 and SSO"
    )

    print(f"\n🎖️ Picard's Analysis:")
    print(f"   {result.picard_reasoning}")
    print(f"\n💰 Quark's ROI Analysis:")
    print(f"   {result.quark_roi_analysis.recommendation}")
    print(f"\n⚡ Riker's Crew Activation:")
    for crew_id in result.activated_crew:
        tier = result.llm_assignments[crew_id]
        print(f"   - {crew_id}: {tier} tier")
    print(f"\n💵 Estimated Cost: ${result.estimated_cost:.4f}")

    # Example 2: Routine task
    print("\n" + "="*80)
    print("Example 2: Routine Bug Fix")
    print("="*80)

    result = orchestrator.orchestrate(
        "Fix a bug in the login form where email validation isn't working"
    )

    print(f"\n🎖️ Picard's Analysis:")
    print(f"   {result.picard_reasoning}")
    print(f"\n💰 Quark's ROI Analysis:")
    print(f"   {result.quark_roi_analysis.recommendation}")
    print(f"\n⚡ Riker's Crew Activation:")
    for crew_id in result.activated_crew:
        tier = result.llm_assignments[crew_id]
        print(f"   - {crew_id}: {tier} tier")
    print(f"\n💵 Estimated Cost: ${result.estimated_cost:.4f}")
    print(f"\n💰 Savings: ${result.quark_roi_analysis.cost_savings:.4f} ({result.quark_roi_analysis.savings_percentage:.1f}%)")


if __name__ == "__main__":
    example_usage()
