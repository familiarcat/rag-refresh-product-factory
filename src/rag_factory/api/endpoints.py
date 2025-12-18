"""FastAPI endpoints for RAG system"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..processing.enhanced_engine import EnhancedRAGProcessor

app = FastAPI(
    title="RAG Product Factory",
    description="Retrieval Augmented Generation system for product management",
    version="0.1.0"
)

processor = EnhancedRAGProcessor()


class InputData(BaseModel):
    crew_member: str
    content: Dict[str, Any]


class MemoryQuery(BaseModel):
    query: str
    limit: int = 5


class ProcessResponse(BaseModel):
    status: str
    memory_id: str
    crew_member: str


@app.post("/process", response_model=ProcessResponse)
async def process_input(data: InputData):
    """Process crew input (text or image)"""
    try:
        memory_id = processor.process_input(data.crew_member, data.content)
        return ProcessResponse(
            status="success",
            memory_id=memory_id,
            crew_member=data.crew_member
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/image", response_model=ProcessResponse)
async def process_image(data: InputData):
    """Process image input from crew"""
    if 'image' not in data.content:
        raise HTTPException(status_code=400, detail="No image data provided")
    
    try:
        memory_id = processor.process_input(data.crew_member, data.content)
        return ProcessResponse(
            status="success",
            memory_id=memory_id,
            crew_member=data.crew_member
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/store", response_model=ProcessResponse)
async def store_memory(data: InputData):
    """Store memory entry"""
    try:
        memory_id = processor.process_crew_input(data.crew_member, data.content)
        return ProcessResponse(
            status="success",
            memory_id=memory_id,
            crew_member=data.crew_member
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/decision")
async def log_decision(crew_member: str, decision: str, context: Dict[str, Any] = None):
    """Log a decision"""
    try:
        memory_id = processor.log_decision(crew_member, decision, context or {})
        return {"status": "success", "memory_id": memory_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/implementation")
async def log_implementation(crew_member: str, implementation: Dict[str, Any]):
    """Log an implementation"""
    try:
        memory_id = processor.log_implementation(crew_member, implementation)
        return {"status": "success", "memory_id": memory_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory/search")
async def search_memories(data: MemoryQuery):
    """Search for similar memories"""
    try:
        results = processor.search_similar_memories(data.query, data.limit)
        return {"status": "success", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/recent")
async def get_recent_memories(limit: int = 10):
    """Get recent memories"""
    try:
        memories = processor.memory_store.list_recent_memories(limit)
        return {"status": "success", "memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "RAG Product Factory"}
