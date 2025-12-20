"""Crew Drill and Optimization System

This module implements a continuous learning system where:
- Synthetic/real scenarios test crew performance across different LLM tier configurations
- Picard evaluates results across 4 metrics: cost, quality, response quality, speed
- System automatically updates crew configs, orchestrator logic, RAG knowledge, and cost database
"""

from .models import (
    DrillScenario,
    DrillExecution,
    DrillEvaluation,
    DrillRun,
    DrillRunResult,
    CostAnalysis,
    QualityAnalysis,
    ResponseAnalysis,
    LatencyAnalysis,
    Recommendations
)

__all__ = [
    'DrillScenario',
    'DrillExecution',
    'DrillEvaluation',
    'DrillRun',
    'DrillRunResult',
    'CostAnalysis',
    'QualityAnalysis',
    'ResponseAnalysis',
    'LatencyAnalysis',
    'Recommendations'
]
