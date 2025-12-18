"""Enhanced RAG Processor with text and image capabilities"""

from typing import Dict, Any, List, Optional
import numpy as np
from ..memory.storage import MemoryStore
from .engine import RAGProcessor
from .image_processor import ImageProcessor


class EnhancedRAGProcessor(RAGProcessor):
    """Enhanced processor with image support and vector embeddings"""
    
    def __init__(self):
        super().__init__()
        self.image_processor = ImageProcessor()
        self.encoder = None  # Will be lazy-loaded
        
    def _get_encoder(self):
        """Lazy load the sentence transformer"""
        if self.encoder is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.encoder = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
            except ImportError:
                return None
        return self.encoder
    
    def encode_text(self, text: str) -> Optional[np.ndarray]:
        """Encode text to vector"""
        encoder = self._get_encoder()
        if encoder is None:
            return None
        return encoder.encode(text)
    
    def process_input(self, crew_member: str, content: Dict[str, Any]) -> str:
        """Process both text and image inputs"""
        if 'image' in content:
            return self._process_image_input(crew_member, content)
        else:
            return self._process_text_input(crew_member, content)
    
    def _process_text_input(self, crew_member: str, content: Dict[str, Any]) -> str:
        """Process text input"""
        text_content = str(content.get('message', ''))
        vector = None
        
        if text_content:
            vector = self.encode_text(text_content)
        
        memory_entry = {
            'source': 'crew',
            'crew_member': crew_member,
            'content': content,
            'type': 'text_input',
            'vector_embedded': vector is not None
        }
        
        if vector is not None:
            return self.memory_store.store(memory_entry, vector)
        else:
            return self.memory_store.store(memory_entry)
    
    def _process_image_input(self, crew_member: str, content: Dict[str, Any]) -> str:
        """Process image input"""
        image_analysis = self.image_processor.process_base64_image(content['image'])
        
        memory_entry = {
            'source': 'crew',
            'crew_member': crew_member,
            'content': {
                'original_content': content,
                'image_analysis': image_analysis
            },
            'type': 'image_input'
        }
        
        return self.memory_store.store(memory_entry)
    
    def search_similar_memories(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar memories"""
        query_vector = self.encode_text(query)
        if query_vector is None:
            return []
        return self.memory_store.search_memories(query_vector, k)
