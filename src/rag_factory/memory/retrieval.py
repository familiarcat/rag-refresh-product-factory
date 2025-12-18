"""Memory retrieval and querying system"""

from typing import Dict, Any, List, Optional
from .storage import MemoryStore


class MemoryRetrieval:
    """Retrieval system for crew memories"""
    
    def __init__(self, memory_store: MemoryStore):
        self.memory_store = memory_store
        
    def get_crew_memories(self, crew_member: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all memories from a specific crew member"""
        results = []
        for memory_id, memory in self.memory_store.memories.items():
            if memory['metadata'].get('crew_member') == crew_member:
                results.append(memory)
        return results[-limit:]
    
    def get_memories_by_type(self, memory_type: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get memories by type"""
        results = []
        for memory_id, memory in self.memory_store.memories.items():
            if memory['metadata'].get('type') == memory_type:
                results.append(memory)
        return results[-limit:]
    
    def get_decision_history(self) -> List[Dict[str, Any]]:
        """Get all recorded decisions"""
        return self.get_memories_by_type('decision', limit=100)
    
    def get_implementation_log(self) -> List[Dict[str, Any]]:
        """Get implementation history"""
        return self.get_memories_by_type('implementation', limit=100)
