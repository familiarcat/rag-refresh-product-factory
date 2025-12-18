"""Security logging for crew actions"""

from typing import Dict, Any, List
from .authorization import CrewMember
from datetime import datetime


class SecurityLog:
    """Log all crew actions for audit trail"""
    
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []
        
    def log_action(self, crew_member: CrewMember, action: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Log an action"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'crew_member': crew_member.name,
            'rank': crew_member.rank.name,
            'action': action,
            'details': details
        }
        self.logs.append(log_entry)
        return log_entry
    
    def get_crew_logs(self, crew_member_name: str) -> List[Dict[str, Any]]:
        """Get all logs for a crew member"""
        return [log for log in self.logs if log['crew_member'] == crew_member_name]
    
    def get_recent_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent logs"""
        return self.logs[-limit:]
