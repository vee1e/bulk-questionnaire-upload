import os
import sys
import pytest
import pytest_asyncio
import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
import main


@pytest_asyncio.fixture
async def client():
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


@pytest_asyncio.fixture(autouse=True)
async def mock_db_services(monkeypatch):
    """Mock database services to avoid requiring MongoDB"""
    
    # Mock database connection functions
    async def mock_connect_to_mongo():
        pass
    
    async def mock_close_mongo_connection():
        pass
    
    monkeypatch.setattr(main, 'connect_to_mongo', mock_connect_to_mongo)
    monkeypatch.setattr(main, 'close_mongo_connection', mock_close_mongo_connection)
    
    # Mock database service
    class MockDatabaseService:
        async def get_all_forms(self):
            return []
        
        async def get_form_by_id(self, form_id: str):
            return None  # Simulate form not found
        
        async def get_questions_by_form_id(self, form_id: str):
            return []
        
        async def get_options_by_form_id(self, form_id: str):
            return []
    
    monkeypatch.setattr(main, 'db_service', MockDatabaseService())
