"""Picard evaluator for holistic drill analysis

Uses Picard's premium LLM to analyze drill results across all metrics
and generate actionable optimization recommendations.
"""

import uuid
import json
import statistics
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from .models import (
    DrillExecution,
    DrillEvaluation,
    CostAnalysis,
    QualityAnalysis,
    ResponseAnalysis,
    LatencyAnalysis,
    Recommendations
)

logger = logging.getLogger(__name__)


class PicardEvaluator:
    """Evaluates drill runs using Picard's strategic analysis"""

    def __init__(
        self,
        cost_database: Dict[str, Any],
        supabase_client=None,
        picard_llm_config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize Picard evaluator

        Args:
            cost_database: LLM cost database
            supabase_client: Supabase client for data access
            picard_llm_config: LLM configuration for Picard (premium tier)
        """
        self.cost_db = cost_database
        self.db = supabase_client

        # Default Picard LLM config
        self.picard_llm_config = picard_llm_config or {
            'model_id': 'anthropic/claude-sonnet-4.5',
            'temperature': 0.7,
            'max_tokens': 3000
        }

    def evaluate_drill_run(self, drill_run_id: str) -> DrillEvaluation:
        """
        Perform holistic evaluation of a drill run

        Args:
            drill_run_id: ID of the drill run to evaluate

        Returns:
            DrillEvaluation with scores and recommendations
        """
        logger.info(f"Evaluating drill run {drill_run_id}")

        # Fetch all executions for this run
        executions = self._fetch_executions(drill_run_id)

        if not executions:
            raise ValueError(f"No executions found for drill run {drill_run_id}")

        # Analyze each metric
        cost_analysis = self.analyze_cost_efficiency(executions)
        quality_analysis = self.analyze_quality_accuracy(executions)
        response_analysis = self.analyze_response_quality(executions)
        latency_analysis = self.analyze_speed_latency(executions)

        # Get historical baselines (if available)
        baseline_data = self._get_historical_baselines()

        # Call Picard LLM for holistic evaluation
        llm_evaluation = self._call_picard_llm({
            'cost_analysis': cost_analysis,
            'quality_analysis': quality_analysis,
            'response_analysis': response_analysis,
            'latency_analysis': latency_analysis,
            'baseline_data': baseline_data,
            'execution_count': len(executions)
        })

        # Generate recommendations
        recommendations = self._generate_recommendations(
            cost_analysis,
            quality_analysis,
            response_analysis,
            latency_analysis,
            llm_evaluation
        )

        # Calculate overall score (weighted average)
        metric_weights = {
            'cost': 0.30,
            'quality': 0.30,
            'response': 0.25,
            'speed': 0.15
        }

        overall_score = (
            cost_analysis.roi_score * metric_weights['cost'] +
            quality_analysis.quality_score * metric_weights['quality'] +
            response_analysis.response_quality_score * metric_weights['response'] +
            latency_analysis.speed_score * metric_weights['speed']
        )

        # Create evaluation
        evaluation = DrillEvaluation(
            id=str(uuid.uuid4()),
            drill_run_id=drill_run_id,
            overall_score=overall_score,
            assessment_summary=llm_evaluation.get('summary', ''),
            detailed_analysis=llm_evaluation.get('detailed_analysis', ''),
            cost_efficiency_score=cost_analysis.roi_score,
            quality_accuracy_score=quality_analysis.quality_score,
            response_quality_score=response_analysis.response_quality_score,
            speed_latency_score=latency_analysis.speed_score,
            recommended_changes=recommendations.crew_tier_updates,
            crew_performance_analysis=self._analyze_crew_performance(executions),
            tier_recommendations=recommendations.crew_tier_updates,
            orchestrator_updates=recommendations.orchestrator_keyword_updates,
            key_findings=llm_evaluation.get('key_findings', []),
            improvement_areas=llm_evaluation.get('improvement_areas', []),
            successful_patterns=llm_evaluation.get('successful_patterns', []),
            confidence_level=recommendations.confidence,
            evaluated_by='captain_picard',
            evaluated_at=datetime.now(),
            llm_model_used=self.picard_llm_config['model_id'],
            created_at=datetime.now()
        )

        # Store evaluation
        if self.db:
            self._store_evaluation(evaluation)

        logger.info(
            f"Evaluation complete: Overall score {overall_score:.1f}, "
            f"Confidence {recommendations.confidence}%"
        )

        return evaluation

    def _fetch_executions(self, drill_run_id: str) -> List[DrillExecution]:
        """Fetch all executions for a drill run"""
        if not self.db:
            return []

        try:
            response = self.db.table('drill_executions').select('*').eq(
                'drill_run_id', drill_run_id
            ).execute()

            executions = []
            for data in response.data:
                try:
                    execution = DrillExecution.from_dict(data)
                    executions.append(execution)
                except Exception as e:
                    logger.error(f"Error parsing execution {data.get('id')}: {e}")
                    continue

            return executions

        except Exception as e:
            logger.error(f"Error fetching executions: {e}")
            return []

    def analyze_cost_efficiency(self, executions: List[DrillExecution]) -> CostAnalysis:
        """
        Analyze cost efficiency across executions

        Args:
            executions: List of drill executions

        Returns:
            CostAnalysis with ROI metrics
        """
        if not executions:
            return CostAnalysis(
                average_cost=0.0,
                median_cost=0.0,
                cost_variance=0.0,
                cost_by_tier_config={},
                savings_vs_baseline=0.0,
                savings_percentage=0.0,
                cost_per_complexity={},
                optimal_tier_config="unknown",
                roi_score=0.0
            )

        costs = [e.total_cost_usd for e in executions]
        average_cost = statistics.mean(costs)
        median_cost = statistics.median(costs)
        cost_variance = statistics.variance(costs) if len(costs) > 1 else 0.0

        # Group by tier configuration
        cost_by_tier = {}
        for execution in executions:
            config = execution.tier_configuration_label or "unknown"
            if config not in cost_by_tier:
                cost_by_tier[config] = []
            cost_by_tier[config].append(execution.total_cost_usd)

        cost_by_tier_avg = {
            config: statistics.mean(costs)
            for config, costs in cost_by_tier.items()
        }

        # Calculate savings vs all_premium baseline
        baseline_cost = cost_by_tier_avg.get('all_premium', average_cost)
        default_cost = cost_by_tier_avg.get('current_default', average_cost)

        savings = baseline_cost - default_cost
        savings_pct = (savings / baseline_cost * 100) if baseline_cost > 0 else 0

        # Find optimal configuration (lowest cost)
        optimal_config = min(cost_by_tier_avg.items(), key=lambda x: x[1])[0] if cost_by_tier_avg else "unknown"

        # Cost by complexity
        cost_by_complexity = {}
        for execution in executions:
            complexity = execution.task_complexity.value if hasattr(execution.task_complexity, 'value') else str(execution.task_complexity)
            if complexity not in cost_by_complexity:
                cost_by_complexity[complexity] = []
            cost_by_complexity[complexity].append(execution.total_cost_usd)

        cost_by_complexity_avg = {
            comp: statistics.mean(costs)
            for comp, costs in cost_by_complexity.items()
        }

        # Calculate ROI score (0-100)
        # Higher score = better cost efficiency
        if savings_pct >= 70:
            roi_score = 100.0
        elif savings_pct >= 50:
            roi_score = 85.0
        elif savings_pct >= 30:
            roi_score = 70.0
        elif savings_pct >= 10:
            roi_score = 55.0
        else:
            roi_score = max(40.0, 40 + savings_pct)

        return CostAnalysis(
            average_cost=average_cost,
            median_cost=median_cost,
            cost_variance=cost_variance,
            cost_by_tier_config=cost_by_tier_avg,
            savings_vs_baseline=savings,
            savings_percentage=savings_pct,
            cost_per_complexity=cost_by_complexity_avg,
            optimal_tier_config=optimal_config,
            roi_score=roi_score
        )

    def analyze_quality_accuracy(self, executions: List[DrillExecution]) -> QualityAnalysis:
        """Analyze quality and accuracy metrics"""
        if not executions:
            return QualityAnalysis(
                average_quality=0.0,
                success_rate=0.0,
                crew_selection_accuracy=0.0,
                tier_assignment_appropriateness=0.0,
                task_completion_rate=0.0,
                quality_by_complexity={},
                quality_score=0.0
            )

        # Filter executions with quality scores
        scored_executions = [e for e in executions if e.quality_score is not None]

        if scored_executions:
            average_quality = statistics.mean([e.quality_score for e in scored_executions])
        else:
            average_quality = 0.0

        # Success rate
        total = len(executions)
        successful = len([e for e in executions if e.execution_status.value == 'success'])
        success_rate = (successful / total * 100) if total > 0 else 0

        # Crew selection accuracy (based on accuracy_score if available)
        accuracy_scored = [e for e in executions if e.accuracy_score is not None]
        if accuracy_scored:
            crew_accuracy = statistics.mean([e.accuracy_score for e in accuracy_scored])
        else:
            crew_accuracy = 0.0

        # Tier assignment appropriateness (heuristic)
        tier_appropriateness = 75.0  # Default reasonable value

        # Task completion rate
        task_completion = success_rate

        # Quality by complexity
        quality_by_complexity = {}
        for execution in scored_executions:
            complexity = execution.task_complexity.value if hasattr(execution.task_complexity, 'value') else str(execution.task_complexity)
            if complexity not in quality_by_complexity:
                quality_by_complexity[complexity] = []
            quality_by_complexity[complexity].append(execution.quality_score)

        quality_by_complexity_avg = {
            comp: statistics.mean(scores)
            for comp, scores in quality_by_complexity.items()
        }

        # Overall quality score
        quality_score = (
            average_quality * 0.4 +
            success_rate * 0.3 +
            crew_accuracy * 0.2 +
            tier_appropriateness * 0.1
        )

        return QualityAnalysis(
            average_quality=average_quality,
            success_rate=success_rate,
            crew_selection_accuracy=crew_accuracy,
            tier_assignment_appropriateness=tier_appropriateness,
            task_completion_rate=task_completion,
            quality_by_complexity=quality_by_complexity_avg,
            quality_score=quality_score
        )

    def analyze_response_quality(self, executions: List[DrillExecution]) -> ResponseAnalysis:
        """Analyze response quality metrics"""
        if not executions:
            return ResponseAnalysis(
                relevance_score=0.0,
                completeness_score=0.0,
                coherence_score=0.0,
                usefulness_score=0.0,
                crew_coordination_score=0.0,
                response_quality_score=0.0
            )

        # Use response_quality_score from executions if available
        scored = [e for e in executions if e.response_quality_score is not None]

        if scored:
            avg_response_quality = statistics.mean([e.response_quality_score for e in scored])
        else:
            avg_response_quality = 0.0

        # Heuristic sub-scores (would be more sophisticated in production)
        relevance = avg_response_quality * 0.95
        completeness = avg_response_quality * 0.90
        coherence = avg_response_quality * 0.92
        usefulness = avg_response_quality
        coordination = avg_response_quality * 0.88

        return ResponseAnalysis(
            relevance_score=relevance,
            completeness_score=completeness,
            coherence_score=coherence,
            usefulness_score=usefulness,
            crew_coordination_score=coordination,
            response_quality_score=avg_response_quality
        )

    def analyze_speed_latency(self, executions: List[DrillExecution]) -> LatencyAnalysis:
        """Analyze speed and latency metrics"""
        if not executions:
            return LatencyAnalysis(
                average_latency_ms=0,
                median_latency_ms=0,
                p95_latency_ms=0,
                latency_variance=0.0,
                timeout_rate=0.0,
                latency_by_tier_config={},
                speed_score=0.0
            )

        latencies = [e.execution_time_ms for e in executions]

        average_latency = int(statistics.mean(latencies))
        median_latency = int(statistics.median(latencies))
        p95_latency = int(sorted(latencies)[int(len(latencies) * 0.95)]) if len(latencies) > 1 else average_latency
        latency_variance = statistics.variance(latencies) if len(latencies) > 1 else 0.0

        # Timeout rate
        total = len(executions)
        timeouts = len([e for e in executions if e.execution_status.value == 'timeout'])
        timeout_rate = (timeouts / total * 100) if total > 0 else 0

        # Latency by tier config
        latency_by_tier = {}
        for execution in executions:
            config = execution.tier_configuration_label or "unknown"
            if config not in latency_by_tier:
                latency_by_tier[config] = []
            latency_by_tier[config].append(execution.execution_time_ms)

        latency_by_tier_avg = {
            config: int(statistics.mean(times))
            for config, times in latency_by_tier.items()
        }

        # Speed score (0-100, lower latency = higher score)
        # Target: < 5000ms = 100, < 10000ms = 80, < 20000ms = 60
        if average_latency < 5000:
            speed_score = 100.0
        elif average_latency < 10000:
            speed_score = 100 - ((average_latency - 5000) / 5000 * 20)
        elif average_latency < 20000:
            speed_score = 80 - ((average_latency - 10000) / 10000 * 20)
        else:
            speed_score = max(40, 60 - ((average_latency - 20000) / 10000 * 10))

        # Penalize timeouts
        speed_score = speed_score * (1 - timeout_rate / 100)

        return LatencyAnalysis(
            average_latency_ms=average_latency,
            median_latency_ms=median_latency,
            p95_latency_ms=p95_latency,
            latency_variance=latency_variance,
            timeout_rate=timeout_rate,
            latency_by_tier_config=latency_by_tier_avg,
            speed_score=speed_score
        )

    def _call_picard_llm(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call Picard's LLM for holistic evaluation

        In production, this would make an actual LLM API call.
        For now, returns structured analysis based on metrics.

        Args:
            analysis_data: All metric analyses

        Returns:
            Dict with LLM evaluation results
        """
        # In production, this would call OpenRouter/Anthropic API
        # For now, generate structured evaluation based on metrics

        cost = analysis_data['cost_analysis']
        quality = analysis_data['quality_analysis']
        response = analysis_data['response_analysis']
        latency = analysis_data['latency_analysis']

        # Generate summary
        summary_parts = []

        if cost.savings_percentage > 50:
            summary_parts.append(f"Excellent cost efficiency with {cost.savings_percentage:.1f}% savings")
        elif cost.savings_percentage > 30:
            summary_parts.append(f"Good cost efficiency with {cost.savings_percentage:.1f}% savings")
        else:
            summary_parts.append(f"Cost optimization opportunity: only {cost.savings_percentage:.1f}% current savings")

        if quality.success_rate > 90:
            summary_parts.append(f"High success rate ({quality.success_rate:.1f}%)")
        elif quality.success_rate > 70:
            summary_parts.append(f"Moderate success rate ({quality.success_rate:.1f}%)")
        else:
            summary_parts.append(f"Low success rate ({quality.success_rate:.1f}%) - needs attention")

        summary = ". ".join(summary_parts) + "."

        # Key findings
        key_findings = []
        if cost.optimal_tier_config != "current_default":
            key_findings.append(f"'{cost.optimal_tier_config}' configuration shows better cost efficiency")

        if quality.crew_selection_accuracy < 70:
            key_findings.append("Crew selection accuracy below 70% - orchestrator may need tuning")

        if latency.timeout_rate > 5:
            key_findings.append(f"High timeout rate ({latency.timeout_rate:.1f}%) indicates performance issues")

        # Improvement areas
        improvement_areas = []
        if cost.roi_score < 70:
            improvement_areas.append("Cost optimization")

        if quality.quality_score < 75:
            improvement_areas.append("Crew selection accuracy")

        if latency.speed_score < 70:
            improvement_areas.append("Execution performance")

        # Successful patterns
        successful_patterns = []
        if cost.roi_score >= 80:
            successful_patterns.append("Effective tier assignments for cost savings")

        if quality.success_rate >= 85:
            successful_patterns.append("Reliable crew activation across scenarios")

        # Detailed analysis
        detailed_analysis = f"""
Comprehensive drill run analysis:

**Cost Efficiency:** {cost.roi_score:.1f}/100
- Average cost: ${cost.average_cost:.6f}
- Savings vs premium: {cost.savings_percentage:.1f}%
- Optimal configuration: {cost.optimal_tier_config}

**Quality & Accuracy:** {quality.quality_score:.1f}/100
- Success rate: {quality.success_rate:.1f}%
- Crew selection accuracy: {quality.crew_selection_accuracy:.1f}%

**Response Quality:** {response.response_quality_score:.1f}/100
- Relevance: {response.relevance_score:.1f}%
- Completeness: {response.completeness_score:.1f}%

**Speed & Latency:** {latency.speed_score:.1f}/100
- Average latency: {latency.average_latency_ms}ms
- P95 latency: {latency.p95_latency_ms}ms
- Timeout rate: {latency.timeout_rate:.1f}%
"""

        return {
            'summary': summary,
            'detailed_analysis': detailed_analysis.strip(),
            'key_findings': key_findings,
            'improvement_areas': improvement_areas,
            'successful_patterns': successful_patterns
        }

    def _generate_recommendations(
        self,
        cost_analysis: CostAnalysis,
        quality_analysis: QualityAnalysis,
        response_analysis: ResponseAnalysis,
        latency_analysis: LatencyAnalysis,
        llm_evaluation: Dict[str, Any]
    ) -> Recommendations:
        """Generate system update recommendations"""

        crew_tier_updates = {}
        orchestrator_updates = {}
        priority_changes = []

        # Recommend tier changes based on cost analysis
        if cost_analysis.optimal_tier_config != "current_default":
            priority_changes.append(f"Consider adopting '{cost_analysis.optimal_tier_config}' tier configuration")

        # Confidence based on data quality
        execution_count = llm_evaluation.get('execution_count', 0)
        if execution_count > 50:
            confidence = 90
        elif execution_count > 20:
            confidence = 80
        else:
            confidence = 70

        rationale = f"Based on {execution_count} drill executions with {cost_analysis.savings_percentage:.1f}% cost savings and {quality_analysis.success_rate:.1f}% success rate."

        return Recommendations(
            crew_tier_updates=crew_tier_updates,
            orchestrator_keyword_updates=orchestrator_updates,
            cost_database_updates={},
            confidence=confidence,
            priority_changes=priority_changes,
            rationale=rationale
        )

    def _analyze_crew_performance(self, executions: List[DrillExecution]) -> Dict[str, Any]:
        """Analyze performance by crew member"""
        crew_stats = {}

        for execution in executions:
            for crew_id in execution.activated_crew:
                if crew_id not in crew_stats:
                    crew_stats[crew_id] = {
                        'activations': 0,
                        'total_cost': 0.0,
                        'successes': 0
                    }

                crew_stats[crew_id]['activations'] += 1
                # Approximate cost per crew member
                if execution.activated_crew:
                    crew_stats[crew_id]['total_cost'] += execution.total_cost_usd / len(execution.activated_crew)

                if execution.execution_status.value == 'success':
                    crew_stats[crew_id]['successes'] += 1

        # Calculate averages
        for crew_id, stats in crew_stats.items():
            if stats['activations'] > 0:
                stats['avg_cost'] = stats['total_cost'] / stats['activations']
                stats['success_rate'] = (stats['successes'] / stats['activations'] * 100)

        return crew_stats

    def _get_historical_baselines(self) -> Dict[str, Any]:
        """Get historical baseline metrics from previous drill runs"""
        # In production, query previous drill evaluations
        # For now, return empty baseline
        return {}

    def _store_evaluation(self, evaluation: DrillEvaluation):
        """Store evaluation in database"""
        if not self.db:
            return

        try:
            data = evaluation.to_dict()
            self.db.table('drill_evaluations').insert(data).execute()
            logger.info(f"Stored evaluation {evaluation.id}")
        except Exception as e:
            logger.error(f"Failed to store evaluation: {e}")
