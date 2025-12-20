"""Data models for crew drill and optimization system"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
import json


class ScenarioType(Enum):
    """Type of drill scenario"""
    SYNTHETIC = "synthetic"
    REAL_WORLD = "real_world"
    BENCHMARK = "benchmark"


class ComplexityLevel(Enum):
    """Task complexity levels"""
    CRITICAL = "critical"
    IMPORTANT = "important"
    ROUTINE = "routine"
    TRIVIAL = "trivial"


class ExecutionStatus(Enum):
    """Execution status"""
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    ERROR = "error"


class RunType(Enum):
    """Drill run type"""
    WEEKLY_AUTO = "weekly_auto"
    MANUAL = "manual"
    ON_DEMAND = "on_demand"


class RunStatus(Enum):
    """Drill run status"""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class DrillScenario:
    """Represents a test scenario for crew drill"""

    id: str
    scenario_type: ScenarioType
    category: str
    complexity_level: ComplexityLevel
    title: str
    description: str
    user_request: str
    expected_expertise: List[str]
    success_criteria: Dict[str, Any]
    baseline_metrics: Optional[Dict[str, Any]] = None
    context_data: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    active: bool = True
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'id': self.id,
            'scenario_type': self.scenario_type.value if isinstance(self.scenario_type, ScenarioType) else self.scenario_type,
            'category': self.category,
            'complexity_level': self.complexity_level.value if isinstance(self.complexity_level, ComplexityLevel) else self.complexity_level,
            'title': self.title,
            'description': self.description,
            'user_request': self.user_request,
            'expected_expertise': self.expected_expertise,
            'success_criteria': self.success_criteria,
            'baseline_metrics': self.baseline_metrics,
            'context_data': self.context_data,
            'tags': self.tags,
            'active': self.active,
            'version': self.version,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DrillScenario':
        """Create from dictionary"""
        return cls(
            id=data['id'],
            scenario_type=ScenarioType(data['scenario_type']) if isinstance(data['scenario_type'], str) else data['scenario_type'],
            category=data['category'],
            complexity_level=ComplexityLevel(data['complexity_level']) if isinstance(data['complexity_level'], str) else data['complexity_level'],
            title=data['title'],
            description=data['description'],
            user_request=data['user_request'],
            expected_expertise=data['expected_expertise'],
            success_criteria=data['success_criteria'],
            baseline_metrics=data.get('baseline_metrics'),
            context_data=data.get('context_data', {}),
            tags=data.get('tags', []),
            active=data.get('active', True),
            version=data.get('version', 1),
            created_at=datetime.fromisoformat(data['created_at']) if data.get('created_at') else None,
            updated_at=datetime.fromisoformat(data['updated_at']) if data.get('updated_at') else None
        )


@dataclass
class DrillExecution:
    """Represents a single scenario execution"""

    id: str
    drill_run_id: str
    scenario_id: str
    executed_at: datetime
    execution_status: ExecutionStatus
    activated_crew: List[str]
    llm_tier_assignments: Dict[str, str]
    task_complexity: ComplexityLevel
    total_cost_usd: float
    execution_time_ms: int
    tokens_used: Dict[str, Dict[str, int]]
    orchestration_result: Dict[str, Any]
    tier_configuration_label: Optional[str] = None
    quality_score: Optional[float] = None
    accuracy_score: Optional[float] = None
    response_quality_score: Optional[float] = None
    crew_responses: Optional[Dict[str, Any]] = None
    error_log: Optional[str] = None
    created_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'id': self.id,
            'drill_run_id': self.drill_run_id,
            'scenario_id': self.scenario_id,
            'executed_at': self.executed_at.isoformat(),
            'execution_status': self.execution_status.value if isinstance(self.execution_status, ExecutionStatus) else self.execution_status,
            'activated_crew': self.activated_crew,
            'llm_tier_assignments': self.llm_tier_assignments,
            'task_complexity': self.task_complexity.value if isinstance(self.task_complexity, ComplexityLevel) else self.task_complexity,
            'total_cost_usd': self.total_cost_usd,
            'execution_time_ms': self.execution_time_ms,
            'tokens_used': self.tokens_used,
            'orchestration_result': self.orchestration_result,
            'tier_configuration_label': self.tier_configuration_label,
            'quality_score': self.quality_score,
            'accuracy_score': self.accuracy_score,
            'response_quality_score': self.response_quality_score,
            'crew_responses': self.crew_responses,
            'error_log': self.error_log,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DrillExecution':
        """Create from dictionary"""
        return cls(
            id=data['id'],
            drill_run_id=data['drill_run_id'],
            scenario_id=data['scenario_id'],
            executed_at=datetime.fromisoformat(data['executed_at']) if isinstance(data['executed_at'], str) else data['executed_at'],
            execution_status=ExecutionStatus(data['execution_status']) if isinstance(data['execution_status'], str) else data['execution_status'],
            activated_crew=data['activated_crew'],
            llm_tier_assignments=data['llm_tier_assignments'],
            task_complexity=ComplexityLevel(data['task_complexity']) if isinstance(data['task_complexity'], str) else data['task_complexity'],
            total_cost_usd=float(data['total_cost_usd']),
            execution_time_ms=int(data['execution_time_ms']),
            tokens_used=data['tokens_used'],
            orchestration_result=data['orchestration_result'],
            tier_configuration_label=data.get('tier_configuration_label'),
            quality_score=float(data['quality_score']) if data.get('quality_score') is not None else None,
            accuracy_score=float(data['accuracy_score']) if data.get('accuracy_score') is not None else None,
            response_quality_score=float(data['response_quality_score']) if data.get('response_quality_score') is not None else None,
            crew_responses=data.get('crew_responses'),
            error_log=data.get('error_log'),
            created_at=datetime.fromisoformat(data['created_at']) if data.get('created_at') else None
        )


@dataclass
class CostAnalysis:
    """Cost efficiency analysis results"""
    average_cost: float
    median_cost: float
    cost_variance: float
    cost_by_tier_config: Dict[str, float]
    savings_vs_baseline: float
    savings_percentage: float
    cost_per_complexity: Dict[str, float]
    optimal_tier_config: str
    roi_score: float  # 0-100


@dataclass
class QualityAnalysis:
    """Quality and accuracy analysis results"""
    average_quality: float
    success_rate: float
    crew_selection_accuracy: float
    tier_assignment_appropriateness: float
    task_completion_rate: float
    quality_by_complexity: Dict[str, float]
    quality_score: float  # 0-100


@dataclass
class ResponseAnalysis:
    """Response quality analysis results"""
    relevance_score: float
    completeness_score: float
    coherence_score: float
    usefulness_score: float
    crew_coordination_score: float
    response_quality_score: float  # 0-100


@dataclass
class LatencyAnalysis:
    """Speed and latency analysis results"""
    average_latency_ms: int
    median_latency_ms: int
    p95_latency_ms: int
    latency_variance: float
    timeout_rate: float
    latency_by_tier_config: Dict[str, int]
    speed_score: float  # 0-100


@dataclass
class Recommendations:
    """System update recommendations"""
    crew_tier_updates: Dict[str, str]  # crew_id -> recommended tier
    orchestrator_keyword_updates: Dict[str, List[str]]  # complexity -> keywords
    cost_database_updates: Dict[str, Any]
    confidence: int  # 0-100
    priority_changes: List[str]
    rationale: str


@dataclass
class DrillEvaluation:
    """Picard's holistic evaluation of a drill run"""

    id: str
    drill_run_id: str
    overall_score: float
    assessment_summary: str
    detailed_analysis: str
    cost_efficiency_score: float
    quality_accuracy_score: float
    response_quality_score: float
    speed_latency_score: float
    recommended_changes: Dict[str, Any]
    crew_performance_analysis: Dict[str, Any]
    tier_recommendations: Dict[str, Any]
    orchestrator_updates: Dict[str, Any]
    key_findings: List[str]
    improvement_areas: List[str]
    successful_patterns: List[str]
    confidence_level: int
    evaluated_by: str = "captain_picard"
    evaluated_at: Optional[datetime] = None
    llm_model_used: Optional[str] = None
    llm_tokens_used: Optional[Dict[str, int]] = None
    evaluation_cost_usd: Optional[float] = None
    created_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'id': self.id,
            'drill_run_id': self.drill_run_id,
            'overall_score': self.overall_score,
            'assessment_summary': self.assessment_summary,
            'detailed_analysis': self.detailed_analysis,
            'cost_efficiency_score': self.cost_efficiency_score,
            'quality_accuracy_score': self.quality_accuracy_score,
            'response_quality_score': self.response_quality_score,
            'speed_latency_score': self.speed_latency_score,
            'recommended_changes': self.recommended_changes,
            'crew_performance_analysis': self.crew_performance_analysis,
            'tier_recommendations': self.tier_recommendations,
            'orchestrator_updates': self.orchestrator_updates,
            'key_findings': self.key_findings,
            'improvement_areas': self.improvement_areas,
            'successful_patterns': self.successful_patterns,
            'confidence_level': self.confidence_level,
            'evaluated_by': self.evaluated_by,
            'evaluated_at': self.evaluated_at.isoformat() if self.evaluated_at else None,
            'llm_model_used': self.llm_model_used,
            'llm_tokens_used': self.llm_tokens_used,
            'evaluation_cost_usd': self.evaluation_cost_usd,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DrillEvaluation':
        """Create from dictionary"""
        return cls(
            id=data['id'],
            drill_run_id=data['drill_run_id'],
            overall_score=float(data['overall_score']),
            assessment_summary=data['assessment_summary'],
            detailed_analysis=data['detailed_analysis'],
            cost_efficiency_score=float(data['cost_efficiency_score']),
            quality_accuracy_score=float(data['quality_accuracy_score']),
            response_quality_score=float(data['response_quality_score']),
            speed_latency_score=float(data['speed_latency_score']),
            recommended_changes=data['recommended_changes'],
            crew_performance_analysis=data['crew_performance_analysis'],
            tier_recommendations=data['tier_recommendations'],
            orchestrator_updates=data['orchestrator_updates'],
            key_findings=data['key_findings'],
            improvement_areas=data['improvement_areas'],
            successful_patterns=data['successful_patterns'],
            confidence_level=int(data['confidence_level']),
            evaluated_by=data.get('evaluated_by', 'captain_picard'),
            evaluated_at=datetime.fromisoformat(data['evaluated_at']) if data.get('evaluated_at') else None,
            llm_model_used=data.get('llm_model_used'),
            llm_tokens_used=data.get('llm_tokens_used'),
            evaluation_cost_usd=float(data['evaluation_cost_usd']) if data.get('evaluation_cost_usd') is not None else None,
            created_at=datetime.fromisoformat(data['created_at']) if data.get('created_at') else None
        )


@dataclass
class DrillRun:
    """Represents a complete drill session"""

    id: str
    started_at: datetime
    run_type: RunType
    status: RunStatus
    total_scenarios: int = 0
    total_executions: int = 0
    total_cost_usd: float = 0.0
    average_quality_score: Optional[float] = None
    average_execution_time_ms: Optional[int] = None
    config: Dict[str, Any] = field(default_factory=dict)
    picard_evaluation_id: Optional[str] = None
    updates_applied: Dict[str, Any] = field(default_factory=dict)
    error_log: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'id': self.id,
            'started_at': self.started_at.isoformat(),
            'run_type': self.run_type.value if isinstance(self.run_type, RunType) else self.run_type,
            'status': self.status.value if isinstance(self.status, RunStatus) else self.status,
            'total_scenarios': self.total_scenarios,
            'total_executions': self.total_executions,
            'total_cost_usd': self.total_cost_usd,
            'average_quality_score': self.average_quality_score,
            'average_execution_time_ms': self.average_execution_time_ms,
            'config': self.config,
            'picard_evaluation_id': self.picard_evaluation_id,
            'updates_applied': self.updates_applied,
            'error_log': self.error_log,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DrillRun':
        """Create from dictionary"""
        return cls(
            id=data['id'],
            started_at=datetime.fromisoformat(data['started_at']) if isinstance(data['started_at'], str) else data['started_at'],
            run_type=RunType(data['run_type']) if isinstance(data['run_type'], str) else data['run_type'],
            status=RunStatus(data['status']) if isinstance(data['status'], str) else data['status'],
            total_scenarios=int(data.get('total_scenarios', 0)),
            total_executions=int(data.get('total_executions', 0)),
            total_cost_usd=float(data.get('total_cost_usd', 0.0)),
            average_quality_score=float(data['average_quality_score']) if data.get('average_quality_score') is not None else None,
            average_execution_time_ms=int(data['average_execution_time_ms']) if data.get('average_execution_time_ms') is not None else None,
            config=data.get('config', {}),
            picard_evaluation_id=data.get('picard_evaluation_id'),
            updates_applied=data.get('updates_applied', {}),
            error_log=data.get('error_log'),
            completed_at=datetime.fromisoformat(data['completed_at']) if data.get('completed_at') else None,
            created_at=datetime.fromisoformat(data['created_at']) if data.get('created_at') else None,
            updated_at=datetime.fromisoformat(data['updated_at']) if data.get('updated_at') else None
        )


@dataclass
class DrillRunResult:
    """Result of a complete drill session"""
    drill_run_id: str
    total_scenarios: int
    total_cost: float
    evaluation_summary: str
    status: RunStatus
    error: Optional[str] = None
