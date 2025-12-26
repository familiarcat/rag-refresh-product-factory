#!/usr/bin/env python3
"""
Update all crew member configurations with tiered LLM options for cost optimization

This script adds tiered model configurations to all crew member JSON files.
"""

import json
import os
from pathlib import Path

# Tiered model configurations by crew role
TIERED_CONFIGS = {
    "captain_picard": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "anthropic/claude-opus-4.5",
            "costPerRequest": 0.0135,
            "description": "Highest capability for critical strategic decisions"
        },
        "standard": {
            "primary": "openai/gpt-4o",
            "fallback": "anthropic/claude-3.5-sonnet",
            "costPerRequest": 0.01,
            "description": "Balanced performance for important decisions"
        },
        "budget": {
            "primary": "meta-llama/llama-3.3-70b-instruct",
            "fallback": "google/gemini-flash-1.5",
            "costPerRequest": 0.001575,
            "description": "Cost-efficient for routine guidance"
        }
    },
    "commander_riker": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0135,
            "description": "High capability for complex tactical coordination"
        },
        "standard": {
            "primary": "openai/gpt-4o",
            "fallback": "anthropic/claude-3.5-sonnet",
            "costPerRequest": 0.01,
            "description": "Balanced performance for tactical execution"
        },
        "budget": {
            "primary": "meta-llama/llama-3.3-70b-instruct",
            "fallback": "google/gemini-flash-1.5",
            "costPerRequest": 0.001575,
            "description": "Cost-efficient for routine coordination"
        }
    },
    "commander_data": {
        "premium": {
            "primary": "openai/o1-preview",
            "fallback": "anthropic/claude-sonnet-4.5",
            "costPerRequest": 0.0375,
            "description": "Advanced reasoning for complex analysis"
        },
        "standard": {
            "primary": "google/gemini-pro-1.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.00375,
            "description": "Large context for data analysis"
        },
        "budget": {
            "primary": "deepseek/deepseek-chat",
            "fallback": "meta-llama/llama-3.3-70b-instruct",
            "costPerRequest": 0.00082,
            "description": "Budget-friendly for simple analytics"
        }
    },
    "geordi_la_forge": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0135,
            "description": "Top capability for infrastructure design"
        },
        "standard": {
            "primary": "anthropic/claude-3.5-sonnet",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0105,
            "description": "Strong coding for DevOps tasks"
        },
        "budget": {
            "primary": "meta-llama/llama-3.3-70b-instruct",
            "fallback": "deepseek/deepseek-chat",
            "costPerRequest": 0.001575,
            "description": "Cost-efficient for routine infrastructure"
        }
    },
    "counselor_troi": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0135,
            "description": "Nuanced understanding for UX decisions"
        },
        "standard": {
            "primary": "openai/gpt-4o",
            "fallback": "anthropic/claude-3.5-sonnet",
            "costPerRequest": 0.01,
            "description": "Good balance for UX analysis"
        },
        "budget": {
            "primary": "google/gemini-flash-1.5",
            "fallback": "meta-llama/llama-3.3-70b-instruct",
            "costPerRequest": 0.00015,
            "description": "Fast and cheap for simple UX review"
        }
    },
    "lieutenant_worf": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0135,
            "description": "Thorough analysis for security audits"
        },
        "standard": {
            "primary": "anthropic/claude-3.5-sonnet",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0105,
            "description": "Strong reasoning for security review"
        },
        "budget": {
            "primary": "meta-llama/llama-3.3-70b-instruct",
            "fallback": "deepseek/deepseek-chat",
            "costPerRequest": 0.001575,
            "description": "Basic security checks"
        }
    },
    "chief_obrien": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0135,
            "description": "Top coding for complex implementation"
        },
        "standard": {
            "primary": "meta-llama/llama-3.3-70b-instruct",
            "fallback": "anthropic/claude-3.5-sonnet",
            "costPerRequest": 0.001575,
            "description": "Good coding at low cost"
        },
        "budget": {
            "primary": "google/gemini-flash-1.5",
            "fallback": "deepseek/deepseek-chat",
            "costPerRequest": 0.00015,
            "description": "Ultra cheap for simple fixes"
        }
    },
    "quark": {
        "premium": {
            "primary": "openai/gpt-4o",
            "fallback": "anthropic/claude-sonnet-4.5",
            "costPerRequest": 0.01,
            "description": "Strategic ROI analysis"
        },
        "standard": {
            "primary": "meta-llama/llama-3.3-70b-instruct",
            "fallback": "google/gemini-flash-1.5",
            "costPerRequest": 0.001575,
            "description": "Cost-conscious cost analysis"
        },
        "budget": {
            "primary": "google/gemini-flash-1.5",
            "fallback": "qwen/qwen-2.5-72b-instruct",
            "costPerRequest": 0.00015,
            "description": "Minimal cost for simple ROI"
        }
    },
    "dr_crusher": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0135,
            "description": "Deep analysis for complex performance issues"
        },
        "standard": {
            "primary": "google/gemini-pro-1.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.00375,
            "description": "Large context for performance diagnostics"
        },
        "budget": {
            "primary": "deepseek/deepseek-chat",
            "fallback": "meta-llama/llama-3.3-70b-instruct",
            "costPerRequest": 0.00082,
            "description": "Budget performance monitoring"
        }
    },
    "lieutenant_uhura": {
        "premium": {
            "primary": "anthropic/claude-sonnet-4.5",
            "fallback": "openai/gpt-4o",
            "costPerRequest": 0.0135,
            "description": "Excellent for complex API design"
        },
        "standard": {
            "primary": "openai/gpt-4o",
            "fallback": "meta-llama/llama-3.3-70b-instruct",
            "costPerRequest": 0.01,
            "description": "Good for API documentation"
        },
        "budget": {
            "primary": "meta-llama/llama-3.3-70b-instruct",
            "fallback": "google/gemini-flash-1.5",
            "costPerRequest": 0.001575,
            "description": "Cost-efficient for simple docs"
        }
    }
}

def update_crew_config(crew_file_path: Path):
    """Update a single crew member configuration file"""
    crew_id = crew_file_path.stem.replace('-', '_')

    if crew_id not in TIERED_CONFIGS:
        print(f"⚠️  No tiered config for {crew_id}, skipping")
        return False

    try:
        # Read existing config
        with open(crew_file_path, 'r') as f:
            config = json.load(f)

        # Check if already has tiered models
        if 'tieredModels' in config.get('aiConfiguration', {}):
            print(f"✓ {crew_id} already has tiered models, skipping")
            return False

        # Add tiered models
        if 'aiConfiguration' not in config:
            config['aiConfiguration'] = {}

        config['aiConfiguration']['tieredModels'] = TIERED_CONFIGS[crew_id]

        # Add dynamic selection config
        config['aiConfiguration']['dynamicSelection'] = {
            "enabled": True,
            "defaultTier": "standard" if crew_id != "captain_picard" else "premium",
            "costOptimization": True,
            "orchestratorControlled": True
        }

        # Write updated config
        with open(crew_file_path, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"✅ Updated {crew_id} with tiered models")
        return True

    except Exception as e:
        print(f"❌ Error updating {crew_id}: {e}")
        return False


def main():
    """Update all crew member configurations"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    crew_dir = project_root / "crew-members"

    print("="*80)
    print("UPDATING CREW CONFIGURATIONS WITH TIERED LLM OPTIONS")
    print("="*80)
    print()

    if not crew_dir.exists():
        print(f"❌ Crew directory not found: {crew_dir}")
        return

    crew_files = list(crew_dir.glob("*.json"))
    updated_count = 0

    for crew_file in sorted(crew_files):
        if update_crew_config(crew_file):
            updated_count += 1

    print()
    print("="*80)
    print(f"✅ Updated {updated_count}/{len(crew_files)} crew configurations")
    print("="*80)


if __name__ == "__main__":
    main()
