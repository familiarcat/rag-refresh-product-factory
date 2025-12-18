"""Tests for RAG memory system"""

import pytest
import numpy as np
from src.rag_factory.memory.storage import MemoryStore, VectorStore


@pytest.fixture
def memory_store():
    return MemoryStore()


@pytest.fixture
def vector_store():
    return VectorStore(dimension=768)


class TestVectorStore:
    def test_vector_store_initialization(self, vector_store):
        assert vector_store.index is not None
        assert len(vector_store.documents) == 0
        assert vector_store.dimension == 768
    
    def test_add_document(self, vector_store):
        vector = np.random.rand(768).astype(np.float32)
        metadata = {'test': 'data'}
        
        vector_store.add_document('doc_1', vector, metadata)
        
        assert 'doc_1' in vector_store.documents
        assert vector_store.document_count == 1


class TestMemoryStore:
    def test_memory_storage(self, memory_store):
        test_content = {
            'source': 'test',
            'content': 'test_memory',
            'type': 'verification',
            'crew_member': 'Data'
        }
        memory_id = memory_store.store(test_content)
        
        assert memory_id in memory_store.memories
        assert memory_store.memories[memory_id]['content'] == test_content
    
    def test_retrieve_memory(self, memory_store):
        test_content = {
            'source': 'test',
            'content': 'test_memory',
            'type': 'verification'
        }
        memory_id = memory_store.store(test_content)
        
        retrieved = memory_store.retrieve(memory_id)
        assert retrieved is not None
        assert retrieved['content'] == test_content
    
    def test_list_recent_memories(self, memory_store):
        for i in range(15):
            memory_store.store({'source': 'test', 'content': f'memory_{i}'})
        
        recent = memory_store.list_recent_memories(10)
        assert len(recent) == 10
