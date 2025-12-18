"""RAG Processing Engine for handling crew inputs"""

from typing import Dict, Any, Optional
from datetime import datetime
from ..memory.storage import MemoryStore


class RAGProcessor:
    """Base RAG processor for crew inputs"""
    
    def __init__(self):
        self.memory_store = MemoryStore()
        self.processing_log = []
        
    def process_crew_input(self, crew_member: str, content: Dict[str, Any]) -> str:
        """Process input from a crew member"""
        memory_entry = {
            'source': 'crew',
            'crew_member': crew_member,
            'content': content,
            'type': 'crew_input'
        }
        
        memory_id = self.memory_store.store(memory_entry)
        self.processing_log.append({
            'timestamp': datetime.now().isoformat(),
            'crew_member': crew_member,
            'memory_id': memory_id
        })
        
        return memory_id
    
    def log_decision(self, crew_member: str, decision: str, context: Dict[str, Any]) -> str:
        """Log a significant decision"""
        memory_entry = {
            'source': 'crew',
            'crew_member': crew_member,
            'content': {
                'decision': decision,
                'context': context
            },
            'type': 'decision'
        }
        
        return self.memory_store.store(memory_entry)
    
    def log_implementation(self, crew_member: str, implementation: Dict[str, Any]) -> str:
        """Log an implementation action"""
        memory_entry = {
            'source': 'crew',
            'crew_member': crew_member,
            'content': implementation,
            'type': 'implementation'
        }
        
        return self.memory_store.store(memory_entry)
