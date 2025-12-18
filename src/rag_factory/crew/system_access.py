"""Crew system access for code, script execution, and file operations"""

import subprocess
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from .authorization import CrewMember
from datetime import datetime


class CrewSystemAccess:
    """System access for crew members - Full CRUD file operations"""
    
    def __init__(self):
        self.active_sessions = {}
        self.execution_log = []
        
    def execute_code(self, crew_member: CrewMember, code: str) -> Dict[str, Any]:
        """Execute code (for analysis, not actual exec)"""
        log = crew_member.log_modification('code_execution', {'code': code[:100]})
        self.execution_log.append(log)
        return log
    
    def create_file(self, crew_member: CrewMember, file_path: str, content: str, overwrite: bool = False) -> Dict[str, Any]:
        """Create a new file"""
        try:
            path = Path(file_path)
            
            if path.exists() and not overwrite:
                raise FileExistsError(f"File already exists: {file_path}")
            
            # Create parent directories if needed
            path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w') as f:
                f.write(content)
            
            result = {
                'status': 'success',
                'path': file_path,
                'content_length': len(content)
            }
            log = crew_member.log_modification('file_create', result)
            result.update(log)
        except Exception as e:
            result = {
                'status': 'error',
                'path': file_path,
                'error': str(e)
            }
            log = crew_member.log_modification('file_create', result)
            result.update(log)
        
        self.execution_log.append(result)
        return result
    
    def read_file(self, crew_member: CrewMember, file_path: str) -> Dict[str, Any]:
        """Read a file"""
        try:
            path = Path(file_path)
            
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            with open(file_path, 'r') as f:
                content = f.read()
            
            result = {
                'status': 'success',
                'path': file_path,
                'content_length': len(content),
                'content': content
            }
            log = crew_member.log_modification('file_read', result)
            result.update(log)
        except Exception as e:
            result = {
                'status': 'error',
                'path': file_path,
                'error': str(e)
            }
            log = crew_member.log_modification('file_read', result)
            result.update(log)
        
        self.execution_log.append(result)
        return result
    
    def update_file(self, crew_member: CrewMember, file_path: str, content: str) -> Dict[str, Any]:
        """Update an existing file"""
        try:
            path = Path(file_path)
            
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            with open(file_path, 'w') as f:
                f.write(content)
            
            result = {
                'status': 'success',
                'path': file_path,
                'content_length': len(content)
            }
            log = crew_member.log_modification('file_update', result)
            result.update(log)
        except Exception as e:
            result = {
                'status': 'error',
                'path': file_path,
                'error': str(e)
            }
            log = crew_member.log_modification('file_update', result)
            result.update(log)
        
        self.execution_log.append(result)
        return result
    
    def delete_file(self, crew_member: CrewMember, file_path: str, force: bool = False) -> Dict[str, Any]:
        """Delete a file"""
        try:
            path = Path(file_path)
            
            if not path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            if path.is_dir():
                raise IsADirectoryError(f"Path is a directory, not a file: {file_path}")
            
            path.unlink()
            
            result = {
                'status': 'success',
                'path': file_path
            }
            log = crew_member.log_modification('file_delete', result)
            result.update(log)
        except Exception as e:
            result = {
                'status': 'error',
                'path': file_path,
                'error': str(e)
            }
            log = crew_member.log_modification('file_delete', result)
            result.update(log)
        
        self.execution_log.append(result)
        return result
    
    def list_files(self, crew_member: CrewMember, directory: str, recursive: bool = False) -> Dict[str, Any]:
        """List files in directory"""
        try:
            path = Path(directory)
            
            if not path.exists():
                raise FileNotFoundError(f"Directory not found: {directory}")
            
            if not path.is_dir():
                raise NotADirectoryError(f"Path is not a directory: {directory}")
            
            if recursive:
                files = [str(f.relative_to(path)) for f in path.rglob('*') if f.is_file()]
            else:
                files = [f.name for f in path.iterdir() if f.is_file()]
            
            result = {
                'status': 'success',
                'directory': directory,
                'file_count': len(files),
                'recursive': recursive,
                'files': files
            }
            log = crew_member.log_modification('file_list', result)
            result.update(log)
        except Exception as e:
            result = {
                'status': 'error',
                'directory': directory,
                'error': str(e)
            }
            log = crew_member.log_modification('file_list', result)
            result.update(log)
        
        self.execution_log.append(result)
        return result
    
    def run_script(self, crew_member: CrewMember, script_path: str, args: List[str] = None) -> Dict[str, Any]:
        """Run a script"""
        try:
            result = subprocess.run(
                [script_path] + (args or []),
                capture_output=True,
                text=True,
                timeout=300
            )
            
            log = crew_member.log_modification('script_execution', {
                'script': script_path,
                'args': args or [],
                'return_code': result.returncode,
                'status': 'success' if result.returncode == 0 else 'error'
            })
            log['stdout'] = result.stdout
            log['stderr'] = result.stderr
        except Exception as e:
            log = crew_member.log_modification('script_execution', {
                'script': script_path,
                'args': args or [],
                'status': 'error',
                'error': str(e)
            })
        
        self.execution_log.append(log)
        return log
