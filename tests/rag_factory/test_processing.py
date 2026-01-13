"""Tests for RAG processing engine"""

import pytest
from src.rag_factory.processing.engine import RAGProcessor
from src.rag_factory.processing.enhanced_engine import EnhancedRAGProcessor
from src.rag_factory.processing.image_processor import ImageProcessor


@pytest.fixture
def processor():
    return RAGProcessor()


@pytest.fixture
def enhanced_processor():
    return EnhancedRAGProcessor()


@pytest.fixture
def image_processor():
    return ImageProcessor()


class TestRAGProcessor:
    def test_processor_initialization(self, processor):
        assert processor.memory_store is not None
        assert len(processor.processing_log) == 0
    
    def test_crew_input_processing(self, processor):
        test_input = {
            'message': 'Test message',
            'priority': 'high'
        }
        memory_id = processor.process_crew_input('Data', test_input)
        
        assert memory_id is not None
        assert len(processor.processing_log) == 1
    
    def test_log_decision(self, processor):
        memory_id = processor.log_decision('Picard', 'Engage', {'status': 'critical'})
        
        assert memory_id is not None
        memory = processor.memory_store.retrieve(memory_id)
        assert memory['content']['content']['decision'] == 'Engage'


class TestEnhancedRAGProcessor:
    def test_enhanced_processor_initialization(self, enhanced_processor):
        assert enhanced_processor.memory_store is not None
        assert enhanced_processor.image_processor is not None
    
    def test_process_text_input(self, enhanced_processor):
        test_input = {
            'message': 'Enhanced processing test'
        }
        memory_id = enhanced_processor.process_input('La Forge', test_input)
        
        assert memory_id is not None
        memory = enhanced_processor.memory_store.retrieve(memory_id)
        assert memory['metadata']['type'] == 'text_input'


class TestImageProcessor:
    def test_image_processor_initialization(self, image_processor):
        assert image_processor.supported_formats is not None
        assert 'PNG' in image_processor.supported_formats
