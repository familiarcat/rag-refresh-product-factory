"""FastAPI endpoints for RAG system"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from ..processing.enhanced_engine import EnhancedRAGProcessor
from ..crew.authorization import CrewMember, CrewRank
from ..crew.system_access import CrewSystemAccess
import os

app = FastAPI(
    title="RAG Product Factory",
    description="Retrieval Augmented Generation system for product management with file operations",
    version="0.1.0"
)

processor = EnhancedRAGProcessor()
system_access = CrewSystemAccess()


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


class FileOperation(BaseModel):
    crew_member: str
    file_path: str
    content: Optional[str] = None
    overwrite: bool = False


class FileListRequest(BaseModel):
    crew_member: str
    directory: str
    recursive: bool = False


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


# FILE OPERATIONS ENDPOINTS

@app.post("/files/create")
async def create_file(data: FileOperation):
    """Create a new file"""
    try:
        crew = CrewMember(data.crew_member, CrewRank.COMMANDER, ["file_operations"])
        result = system_access.create_file(crew, data.file_path, data.content or "", data.overwrite)
        return {"status": "success", "operation": "create", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/read/{file_path:path}")
async def read_file(file_path: str, crew_member: str = "system"):
    """Read a file"""
    try:
        crew = CrewMember(crew_member, CrewRank.COMMANDER, ["file_operations"])
        result = system_access.read_file(crew, file_path)
        if result.get('status') == 'error':
            raise HTTPException(status_code=404, detail=result.get('error'))
        return {"status": "success", "operation": "read", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/update")
async def update_file(data: FileOperation):
    """Update an existing file"""
    try:
        crew = CrewMember(data.crew_member, CrewRank.COMMANDER, ["file_operations"])
        result = system_access.update_file(crew, data.file_path, data.content or "")
        return {"status": "success", "operation": "update", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/files/delete/{file_path:path}")
async def delete_file(file_path: str, crew_member: str = "system"):
    """Delete a file"""
    try:
        crew = CrewMember(crew_member, CrewRank.COMMANDER, ["file_operations"])
        result = system_access.delete_file(crew, file_path)
        if result.get('status') == 'error':
            raise HTTPException(status_code=404, detail=result.get('error'))
        return {"status": "success", "operation": "delete", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/list")
async def list_files(data: FileListRequest):
    """List files in a directory"""
    try:
        crew = CrewMember(data.crew_member, CrewRank.COMMANDER, ["file_operations"])
        result = system_access.list_files(crew, data.directory, data.recursive)
        if result.get('status') == 'error':
            raise HTTPException(status_code=404, detail=result.get('error'))
        return {"status": "success", "operation": "list", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# IMAGE ANALYSIS ENDPOINTS

@app.post("/image/analyze")
async def analyze_image(data: InputData):
    """Analyze an image from base64"""
    try:
        if 'image' not in data.content:
            raise HTTPException(status_code=400, detail="No image data provided")
        
        image_analysis = processor.image_processor.process_base64_image(data.content['image'])
        
        memory_entry = {
            'source': 'crew',
            'crew_member': data.crew_member,
            'content': {
                'image_analysis': image_analysis
            },
            'type': 'image_analysis'
        }
        
        memory_id = processor.memory_store.store(memory_entry)
        
        return {
            "status": "success",
            "memory_id": memory_id,
            "analysis": image_analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image/analyze-file/{file_path:path}")
async def analyze_image_file(file_path: str, crew_member: str = "system"):
    """Analyze an image file from disk"""
    try:
        analysis = processor.image_processor.analyze_image_file(file_path)
        
        if analysis.get('status') == 'error':
            raise HTTPException(status_code=404, detail=analysis.get('error'))
        
        memory_entry = {
            'source': 'crew',
            'crew_member': crew_member,
            'content': {
                'image_analysis': analysis
            },
            'type': 'image_analysis'
        }
        
        memory_id = processor.memory_store.store(memory_entry)
        
        return {
            "status": "success",
            "memory_id": memory_id,
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "RAG Product Factory",
        "capabilities": {
            "memory": "FAISS vector store",
            "processing": "Text and image",
            "files": "Full CRUD support",
            "crew": "Authorization enabled"
        }
    }
