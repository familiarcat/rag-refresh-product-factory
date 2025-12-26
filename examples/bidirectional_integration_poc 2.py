"""
Proof of Concept: Bidirectional Learning Integration
Alex AI Crew ↔ Claude Code

This example demonstrates:
1. Claude Code logging actions to Alex AI RAG
2. Crew members querying Claude's history
3. Collaborative problem solving
4. Knowledge synthesis
"""

import asyncio
import requests
from typing import Dict, Any, List


class BidirectionalIntegrationPOC:
    """Proof of concept for bidirectional learning between Alex AI and Claude Code"""

    def __init__(self, rag_api_url: str = "http://localhost:8000"):
        self.rag_api_url = rag_api_url

    def log_claude_action(
        self,
        action_type: str,
        summary: str,
        reasoning: str,
        files_affected: List[str] = None,
        outcome: str = "success",
        user_request: str = None,
        tags: List[str] = None
    ) -> Dict[str, Any]:
        """
        Example: Claude Code logs an action to Alex AI RAG
        """
        response = requests.post(
            f"{self.rag_api_url}/claude/log_action",
            json={
                "action_type": action_type,
                "summary": summary,
                "detailed_content": {
                    "description": summary,
                    "files": files_affected or []
                },
                "reasoning": reasoning,
                "outcome": outcome,
                "confidence": 1.0,
                "files_affected": files_affected or [],
                "tags": tags or [],
                "alternatives_considered": [],
                "user_request": user_request
            }
        )
        return response.json()

    def query_claude_history(
        self,
        query: str,
        action_type: str = None,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Example: Crew member queries Claude's past solutions
        """
        response = requests.post(
            f"{self.rag_api_url}/claude/query_history",
            json={
                "query": query,
                "action_type": action_type,
                "limit": limit
            }
        )
        return response.json()


def example_1_claude_logs_bug_fix():
    """
    Example 1: Claude Code fixes a bug and logs it to Alex AI RAG
    """
    print("\n" + "="*80)
    print("EXAMPLE 1: Claude Code Logs Bug Fix")
    print("="*80 + "\n")

    poc = BidirectionalIntegrationPOC()

    # Simulate Claude Code fixing an authentication bug
    result = poc.log_claude_action(
        action_type="bug_fix",
        summary="Fixed session token expiration causing auth redirect loops",
        reasoning="Session TTL was 1 hour but refresh token check was after 2 hours, causing users to be stuck in redirect loops. Extended session TTL to 24h and added refresh token rotation.",
        files_affected=[
            "src/auth/session.ts",
            "src/middleware/auth.ts"
        ],
        outcome="success",
        user_request="Fix authentication issues where users keep getting logged out",
        tags=["authentication", "bug_fix", "session", "security"]
    )

    print(f"✅ Claude Code action logged!")
    print(f"   Memory ID: {result.get('memory_id')}")
    print(f"   Crew Analog: {result.get('crew_analog')}")
    print(f"   Message: {result.get('message')}")
    print(f"\n   The crew can now reference this solution when consulted about auth issues.")


def example_2_worf_queries_claude_security_fixes():
    """
    Example 2: Lt. Worf queries Claude's past security fixes
    """
    print("\n" + "="*80)
    print("EXAMPLE 2: Worf Queries Claude's Security History")
    print("="*80 + "\n")

    poc = BidirectionalIntegrationPOC()

    # Lt. Worf wants to know about past security fixes
    print("⚔️  Lt. Worf: 'I need to review all security measures Claude Code has implemented.'")
    print("\n   Querying RAG for Claude's security actions...\n")

    result = poc.query_claude_history(
        query="security fixes and authentication improvements",
        action_type="security_fix",
        limit=5
    )

    print(f"   Found {result.get('count')} relevant actions:\n")

    for i, action in enumerate(result.get('actions', []), 1):
        content = action.get('content', {})
        print(f"   {i}. {content.get('summary', 'Unknown')}")
        print(f"      Type: {content.get('content_type', 'N/A')}")
        print(f"      Outcome: {content.get('outcome', 'N/A')}")
        print(f"      Confidence: {content.get('confidence', 0):.0%}")
        print()

    print("⚔️  Lt. Worf: 'This intelligence will inform my security recommendations.'")


def example_3_collaborative_architecture_decision():
    """
    Example 3: Claude + Crew collaborate on architecture decision
    """
    print("\n" + "="*80)
    print("EXAMPLE 3: Collaborative Architecture Decision")
    print("="*80 + "\n")

    print("📋 Scenario: User asks about microservices vs monolith architecture\n")

    print("Step 1: Claude Code logs initial analysis")
    print("----------------------------------------")

    poc = BidirectionalIntegrationPOC()

    claude_analysis = poc.log_claude_action(
        action_type="analysis",
        summary="Architecture analysis: Microservices vs Monolith for inventory system",
        reasoning="""
        Analyzed current scale (500 users, 10k products), team size (3 developers),
        and growth projections. Current scale doesn't justify microservices complexity.
        Microservices would add significant operational overhead and deployment complexity.
        Recommend starting with modular monolith with clear domain boundaries.
        """,
        tags=["architecture", "analysis", "decision", "monolith", "microservices"],
        user_request="Should we use microservices or monolith for our new inventory system?"
    )

    print(f"   ✅ Claude's analysis logged (Memory ID: {claude_analysis.get('memory_id')})")
    print(f"   Crew Analog: {claude_analysis.get('crew_analog')}")

    print("\nStep 2: Crew members provide their perspectives")
    print("------------------------------------------------")
    print("   (In real implementation, this would call alex_ai_observation_lounge)")
    print()
    print("   🎖️  Captain Picard: 'Strategic flexibility is paramount. While monolith")
    print("       serves immediate needs, ensure domain boundaries enable future extraction.'")
    print()
    print("   🤖 Commander Data: 'Computational overhead analysis indicates microservices")
    print("       would increase latency by 3.2x. At current scale, monolith is optimal.'")
    print()
    print("   💰 Quark: 'Cost analysis: Microservices infrastructure $12k/month vs")
    print("       $2k/month for monolith. ROI doesn't justify additional expense.'")
    print()
    print("   ⚡ Commander Riker: 'Tactical recommendation: Start with modular monolith,")
    print("       establish clear service boundaries, migrate when metrics justify it.'")

    print("\nStep 3: Synthesized Decision")
    print("---------------------------")
    print("   📊 Combined Intelligence:")
    print("   - Claude's implementation analysis + Picard's strategic thinking")
    print("   - Data's computational assessment + Quark's cost analysis")
    print("   - Riker's tactical plan")
    print()
    print("   ✅ DECISION: Modular monolith with migration path")
    print("   📝 This decision is now in RAG for future reference")


def example_4_crew_learns_from_claude():
    """
    Example 4: Crew member learns from Claude's past implementation
    """
    print("\n" + "="*80)
    print("EXAMPLE 4: Chief O'Brien Learns from Claude's Implementation")
    print("="*80 + "\n")

    print("📋 Scenario: User asks O'Brien about implementing rate limiting\n")

    poc = BidirectionalIntegrationPOC()

    print("🛠️  Chief O'Brien: 'Let me check if Claude has dealt with this before...'")
    print("\n   Querying Claude's implementation history...\n")

    result = poc.query_claude_history(
        query="rate limiting API implementation",
        action_type="feature_implementation",
        limit=3
    )

    if result.get('count', 0) > 0:
        print(f"   Found {result.get('count')} relevant implementations:\n")

        first_action = result.get('actions', [{}])[0]
        content = first_action.get('content', {})

        print(f"   📄 {content.get('summary', 'Implementation found')}")
        print(f"      Reasoning: {content.get('reasoning', 'N/A')[:100]}...")
        print(f"      Outcome: {content.get('outcome', 'N/A')}")
        print()

        print("🛠️  Chief O'Brien: 'Ah, Claude used a token bucket algorithm. Smart.")
        print("     I'll implement the same pattern but add Redis for distributed")
        print("     rate limiting since we have multiple servers. Simple and practical.'")
        print()
        print("   💡 O'Brien builds on Claude's solution with his operational expertise")
    else:
        print("   No past implementations found.")
        print()
        print("🛠️  Chief O'Brien: 'Fresh implementation then. I'll use a token bucket")
        print("     algorithm with Redis. Once it's working, I'll log it so the crew")
        print("     knows this pattern for next time.'")


def example_5_learning_cycle():
    """
    Example 5: Complete learning cycle - Claude learns from crew learns from Claude
    """
    print("\n" + "="*80)
    print("EXAMPLE 5: Complete Bidirectional Learning Cycle")
    print("="*80 + "\n")

    poc = BidirectionalIntegrationPOC()

    print("Week 1: Claude implements caching strategy")
    print("-------------------------------------------")
    result1 = poc.log_claude_action(
        action_type="optimization",
        summary="Implemented Redis caching for product queries",
        reasoning="Database queries taking 200ms, added Redis cache reducing to 15ms",
        files_affected=["src/cache/redis.ts", "src/repositories/product.ts"],
        outcome="success",
        tags=["caching", "optimization", "redis", "performance"]
    )
    print(f"   ✅ Logged (Memory: {result1.get('memory_id')})")
    print(f"   Performance: 200ms → 15ms")

    print("\nWeek 2: Data analyzes Claude's implementation")
    print("----------------------------------------------")
    print("   🤖 Commander Data reviews Claude's caching pattern")
    print("   Data: 'Fascinating. Claude's TTL of 5 minutes is suboptimal for")
    print("         product data which changes hourly. I calculate 30-minute TTL")
    print("         would reduce cache misses by 67% while maintaining freshness.'")
    print()
    print("   📝 Data's analysis logged to RAG with crew_analog='commander_data'")

    print("\nWeek 3: Claude queries crew knowledge")
    print("--------------------------------------")
    print("   User asks Claude to optimize caching further")
    print("   Claude queries: 'caching optimization recommendations'")
    print()

    result2 = poc.query_claude_history(
        query="caching optimization and TTL recommendations",
        limit=5
    )

    print(f"   Claude finds Data's analysis about TTL optimization")
    print(f"   Claude: 'Based on Commander Data's analysis, I'll adjust the TTL")
    print(f"           from 5 minutes to 30 minutes. His computational assessment")
    print(f"           shows this will improve hit rate significantly.'")

    print("\nWeek 4: Collaborative synthesis")
    print("--------------------------------")
    print("   📊 Knowledge Graph:")
    print("   Claude (implementation) → Data (analysis) → Claude (optimization)")
    print()
    print("   Both systems have learned:")
    print("   - Crew knows Claude's caching pattern")
    print("   - Claude incorporates Data's analytical insights")
    print("   - Future caching implementations benefit from combined knowledge")


def main():
    """Run all proof-of-concept examples"""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*15 + "BIDIRECTIONAL INTEGRATION PROOF OF CONCEPT" + " "*21 + "║")
    print("║" + " "*20 + "Alex AI Crew ↔ Claude Code" + " "*31 + "║")
    print("╚" + "="*78 + "╝")

    print("\nThis POC demonstrates bidirectional learning where:")
    print("  • Claude Code logs actions to Alex AI's RAG")
    print("  • Crew members query Claude's implementation history")
    print("  • Both systems learn from each other's expertise")
    print("  • Combined intelligence exceeds individual capabilities")

    try:
        example_1_claude_logs_bug_fix()
        example_2_worf_queries_claude_security_fixes()
        example_3_collaborative_architecture_decision()
        example_4_crew_learns_from_claude()
        example_5_learning_cycle()

        print("\n" + "="*80)
        print("POC COMPLETE")
        print("="*80)
        print("\n✅ All examples executed successfully!")
        print("\n📊 Summary:")
        print("   - Claude logged 4 actions to Alex AI RAG")
        print("   - Crew queried Claude's history 3 times")
        print("   - 1 collaborative decision completed")
        print("   - Complete learning cycle demonstrated")
        print("\n🚀 Next Steps:")
        print("   1. Start RAG API server: python -m src.rag_factory.server")
        print("   2. Run this POC: python examples/bidirectional_integration_poc.py")
        print("   3. View stored memories via API: curl http://localhost:8000/memory/recent")
        print("   4. Query Claude's history: Use /claude/query_history endpoint")
        print()

    except requests.exceptions.ConnectionError:
        print("\n" + "="*80)
        print("⚠️  CONNECTION ERROR")
        print("="*80)
        print("\nThe RAG API server is not running.")
        print("\nTo run this POC:")
        print("  1. Start the RAG API server:")
        print("     cd /path/to/project")
        print("     python -m src.rag_factory.server")
        print()
        print("  2. In another terminal, run this POC:")
        print("     python examples/bidirectional_integration_poc.py")
        print()
        print("For now, examples shown with simulated output above.")
        print()


if __name__ == "__main__":
    main()
