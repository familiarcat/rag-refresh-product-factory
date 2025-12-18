"""Tests for crew authorization system"""

import pytest
from src.rag_factory.crew.authorization import CrewMember, CrewRank
from src.rag_factory.crew.system_access import CrewSystemAccess
from src.rag_factory.crew.security_log import SecurityLog


@pytest.fixture
def crew_member():
    return CrewMember("Data", CrewRank.COMMANDER, ["technical", "analysis"])


@pytest.fixture
def system_access():
    return CrewSystemAccess()


@pytest.fixture
def security_log():
    return SecurityLog()


class TestCrewMember:
    def test_crew_member_creation(self, crew_member):
        assert crew_member.name == "Data"
        assert crew_member.rank == CrewRank.COMMANDER
        assert "technical" in crew_member.specialties
        assert crew_member.authorization_code is not None
    
    def test_crew_member_can_modify(self, crew_member):
        assert crew_member.can_modify("test_component")
    
    def test_log_modification(self, crew_member):
        log = crew_member.log_modification("test_file", {"change": "value"})
        
        assert log["crew_member"] == "Data"
        assert log["rank"] == "COMMANDER"


class TestCrewSystemAccess:
    def test_execute_code(self, system_access, crew_member):
        log = system_access.execute_code(crew_member, "print('hello')")
        
        assert log is not None
        assert len(system_access.execution_log) == 1
    
    def test_update_file(self, system_access, crew_member):
        log = system_access.update_file(crew_member, "test.py", "content")
        
        assert log is not None
        assert log["component"] == "file_update"


class TestSecurityLog:
    def test_log_action(self, security_log, crew_member):
        log = security_log.log_action(crew_member, "system_access", {"target": "file"})
        
        assert log is not None
        assert len(security_log.logs) == 1
    
    def test_get_crew_logs(self, security_log, crew_member):
        security_log.log_action(crew_member, "action1", {})
        security_log.log_action(crew_member, "action2", {})
        
        logs = security_log.get_crew_logs("Data")
        assert len(logs) == 2
