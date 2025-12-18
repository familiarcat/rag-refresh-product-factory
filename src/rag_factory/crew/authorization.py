"""Crew authorization system for Alex AI"""

from enum import Enum
from typing import List, Dict
from datetime import datetime
import hashlib


class CrewRank(Enum):
    """Crew member rank levels"""
    CAPTAIN = 5
    COMMANDER = 4
    LIEUTENANT_COMMANDER = 3
    LIEUTENANT = 2
    ENSIGN = 1


class CrewMember:
    """Represents a crew member with authorization"""
    
    def __init__(self, name: str, rank: CrewRank, specialties: List[str]):
        self.name = name
        self.rank = rank
        self.specialties = specialties
        self.authorization_code = self._generate_auth_code()
        self.created_at = datetime.now().isoformat()
        
    def _generate_auth_code(self) -> str:
        """Generate authorization code"""
        auth_string = f"{self.name}:{self.rank.name}:{datetime.now().isoformat()}"
        return hashlib.sha256(auth_string.encode()).hexdigest()[:16]
    
    def can_modify(self, system_component: str) -> bool:
        """Check if crew member can modify component"""
        # All crew members have modification access
        return True
    
    def log_modification(self, component: str, changes: Dict) -> Dict:
        """Log a modification"""
        return {
            'crew_member': self.name,
            'rank': self.rank.name,
            'timestamp': datetime.now().isoformat(),
            'component': component,
            'changes': changes
        }
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'rank': self.rank.name,
            'specialties': self.specialties,
            'authorization_code': self.authorization_code,
            'created_at': self.created_at
        }
