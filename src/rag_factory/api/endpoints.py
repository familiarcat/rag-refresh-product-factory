"""FastAPI endpoints for RAG system"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from ..processing.enhanced_engine import EnhancedRAGProcessor
from ..crew.authorization import CrewMember, CrewRank
from ..crew.system_access import CrewSystemAccess
from ..integrations.claude_observer import ClaudeCodeObserver, ClaudeCodeAction
import os

app = FastAPI(
    title="RAG Product Factory",
    description="Retrieval Augmented Generation system for product management with file operations",
    version="0.1.0"
)

processor = EnhancedRAGProcessor()
system_access = CrewSystemAccess()
claude_observer = ClaudeCodeObserver(memory_store=processor.memory_store)


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


# CLAUDE CODE INTEGRATION ENDPOINTS

class ClaudeActionRequest(BaseModel):
    action_type: str
    summary: str
    detailed_content: Dict[str, Any]
    reasoning: str
    outcome: str = "success"
    confidence: float = 1.0
    files_affected: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    alternatives_considered: Optional[List[str]] = None
    user_request: Optional[str] = None


class ClaudeQueryRequest(BaseModel):
    query: str
    action_type: Optional[str] = None
    min_confidence: float = 0.0
    limit: int = 5


@app.post("/claude/log_action")
async def log_claude_action(data: ClaudeActionRequest):
    """
    Log a Claude Code action to Alex AI's RAG system.

    This enables the crew to learn from Claude's decisions and implementations.
    """
    try:
        action = ClaudeCodeAction(
            action_type=data.action_type,
            summary=data.summary,
            detailed_content=data.detailed_content,
            reasoning=data.reasoning,
            outcome=data.outcome,
            confidence=data.confidence,
            files_affected=data.files_affected,
            tags=data.tags,
            alternatives_considered=data.alternatives_considered,
            user_request=data.user_request
        )

        memory_id = claude_observer.log_action(action)

        return {
            "status": "success",
            "memory_id": memory_id,
            "crew_analog": claude_observer.crew_mapper.map_action_to_crew(action),
            "message": "Claude Code action logged to Alex AI RAG"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/claude/log_code_modification")
async def log_code_modification(
    files_modified: List[str],
    summary: str,
    reasoning: str,
    diff_summary: Optional[str] = None,
    outcome: str = "success",
    user_request: Optional[str] = None,
    tags: Optional[List[str]] = None
):
    """Convenience endpoint for logging code modifications"""
    try:
        memory_id = claude_observer.log_code_modification(
            files_modified=files_modified,
            summary=summary,
            reasoning=reasoning,
            diff_summary=diff_summary,
            outcome=outcome,
            user_request=user_request,
            tags=tags
        )

        return {
            "status": "success",
            "memory_id": memory_id,
            "message": "Code modification logged"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/claude/log_decision")
async def log_claude_decision(
    decision: str,
    reasoning: str,
    alternatives: List[str],
    context: Dict[str, Any],
    confidence: float = 0.8,
    user_request: Optional[str] = None,
    tags: Optional[List[str]] = None
):
    """Log an architectural or strategic decision"""
    try:
        memory_id = claude_observer.log_decision(
            decision=decision,
            reasoning=reasoning,
            alternatives=alternatives,
            context=context,
            confidence=confidence,
            user_request=user_request,
            tags=tags
        )

        return {
            "status": "success",
            "memory_id": memory_id,
            "message": "Decision logged"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/claude/log_bug_fix")
async def log_bug_fix(
    bug_description: str,
    root_cause: str,
    solution: str,
    files_affected: List[str],
    outcome: str = "success",
    user_request: Optional[str] = None,
    tags: Optional[List[str]] = None
):
    """Log a bug fix"""
    try:
        memory_id = claude_observer.log_bug_fix(
            bug_description=bug_description,
            root_cause=root_cause,
            solution=solution,
            files_affected=files_affected,
            outcome=outcome,
            user_request=user_request,
            tags=tags
        )

        return {
            "status": "success",
            "memory_id": memory_id,
            "message": "Bug fix logged"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/claude/session_summary")
async def get_claude_session_summary():
    """Get a summary of Claude Code's actions in this session"""
    try:
        summary = claude_observer.get_session_summary()
        return {
            "status": "success",
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/claude/query_history")
async def query_claude_history(data: ClaudeQueryRequest):
    """
    Query Claude Code's past actions using semantic search.

    This endpoint allows the crew to learn from Claude's history.
    Note: Requires embedding generation for the query.
    """
    try:
        # For now, return recent memories filtered by tags
        # TODO: Implement proper vector search with query embedding
        recent = processor.memory_store.list_recent_memories(limit=50)

        # Filter for Claude Code actions
        claude_actions = [
            m for m in recent
            if m.get('content', {}).get('source') == 'claude_code'
        ]

        # Apply filters
        if data.action_type:
            claude_actions = [
                m for m in claude_actions
                if m.get('content', {}).get('content_type') == data.action_type
            ]

        # Apply confidence filter
        claude_actions = [
            m for m in claude_actions
            if m.get('content', {}).get('confidence', 0) >= data.min_confidence
        ]

        # Limit results
        claude_actions = claude_actions[:data.limit]

        return {
            "status": "success",
            "count": len(claude_actions),
            "actions": claude_actions
        }
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
            "crew": "Authorization enabled",
            "claude_integration": "Bidirectional learning enabled"
        }
    }
