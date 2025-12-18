"""Memory storage system for RAG - Stores crew memories and analysis"""

from typing import Dict, Any, Optional, List
import faiss
import numpy as np
from datetime import datetime
import json


class VectorStore:
    """Vector storage using FAISS for similarity search"""
    
    def __init__(self, dimension: int = 768):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.documents = {}
        self.document_count = 0
        
    def add_document(self, doc_id: str, vector: np.ndarray, metadata: Dict[str, Any]):
        """Add a document with its vector embedding"""
        if vector.shape[0] != self.dimension:
            raise ValueError(f"Expected dimension {self.dimension}, got {vector.shape[0]}")
        
        self.index.add(vector.reshape(1, -1))
        self.documents[doc_id] = metadata
        self.document_count += 1
        
    def search(self, query_vector: np.ndarray, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        if self.document_count == 0:
            return []
        
        query_vector = query_vector.reshape(1, -1)
        distances, indices = self.index.search(query_vector, min(k, self.document_count))
        
        results = []
        doc_ids = list(self.documents.keys())
        for i, idx in enumerate(indices[0]):
            if idx < len(doc_ids):
                doc_id = doc_ids[idx]
                results.append({
                    'doc_id': doc_id,
                    'metadata': self.documents[doc_id],
                    'distance': float(distances[0][i])
                })
        return results


class MemoryStore:
    """Central memory store for crew interactions and analysis"""
    
    def __init__(self):
        self.vector_store = VectorStore()
        self.memories = {}
        self.memory_index = []
        
    def store(self, content: Dict[str, Any], vector: Optional[np.ndarray] = None) -> str:
        """Store a memory entry"""
        timestamp = datetime.now().isoformat()
        memory_id = f"mem_{timestamp}_{len(self.memories)}"
        
        memory_entry = {
            'id': memory_id,
            'content': content,
            'timestamp': timestamp,
            'metadata': {
                'source': content.get('source', 'crew'),
                'type': content.get('type', 'analysis'),
                'crew_member': content.get('crew_member', 'unknown')
            }
        }
        
        self.memories[memory_id] = memory_entry
        self.memory_index.append(memory_id)
        
        if vector is not None:
            self.vector_store.add_document(memory_id, vector, memory_entry['metadata'])
            
        return memory_id
    
    def retrieve(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific memory"""
        return self.memories.get(memory_id)
    
    def search_memories(self, query_vector: np.ndarray, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar memories"""
        results = self.vector_store.search(query_vector, k)
        
        search_results = []
        for result in results:
            memory = self.memories.get(result['doc_id'])
            if memory:
                search_results.append({
                    'memory': memory,
                    'distance': result['distance']
                })
        return search_results
    
    def list_recent_memories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent memories"""
        return [
            self.memories[memory_id] 
            for memory_id in self.memory_index[-limit:]
        ]
