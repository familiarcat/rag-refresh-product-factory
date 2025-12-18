"""RAG Factory Server - Start the API server"""

import uvicorn
import yaml
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


def load_config():
    """Load configuration from rag_config.yaml"""
    config_path = Path("config/rag_config.yaml")
    try:
        with open(config_path) as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        logger.warning(f"Config file not found at {config_path}, using defaults")
        return {
            'rag_factory': {
                'api': {
                    'host': '0.0.0.0',
                    'port': 8000,
                    'reload': True
                }
            }
        }


def start_server():
    """Start the RAG Factory API server"""
    config = load_config()
    api_config = config['rag_factory']['api']
    
    logger.info(f"Starting RAG Factory Server on {api_config['host']}:{api_config['port']}")
    
    uvicorn.run(
        "src.rag_factory.api.endpoints:app",
        host=api_config['host'],
        port=api_config['port'],
        reload=api_config.get('reload', True)
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_server()
