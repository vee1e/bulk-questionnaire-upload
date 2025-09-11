import os
import sys
import io
import pytest
import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
import main


@pytest.mark.asyncio
async def test_validate_invalid_extension(client: httpx.AsyncClient):
    """Test validation endpoint with invalid file extension"""
    files = {'file': ('bad.txt', b'data', 'text/plain')}
    resp = await client.post('/api/validate', files=files)
    assert resp.status_code == 200
    body = resp.json()
    assert body['valid'] is False
    assert 'Only .xls/.xlsx' in body['message']


@pytest.mark.asyncio
async def test_parse_missing_file_name(client: httpx.AsyncClient):
    """Test parse endpoint with no file uploaded"""
    resp = await client.post('/api/forms/parse', data={})
    assert resp.status_code == 400
    detail = resp.json()['detail']
    assert detail['error_type'] == 'MISSING_FILE'


@pytest.mark.asyncio
async def test_parse_invalid_extension(client: httpx.AsyncClient):
    """Test parse endpoint with invalid file extension"""
    files = {'file': ('bad.txt', io.BytesIO(b'data'), 'text/plain')}
    resp = await client.post('/api/forms/parse', files=files)
    assert resp.status_code == 400
    detail = resp.json()['detail']
    assert detail['error_type'] == 'INVALID_FILE_FORMAT'


@pytest.mark.asyncio
async def test_get_all_forms_empty(client: httpx.AsyncClient):
    """Test getting all forms when database is empty (mocked)"""
    resp = await client.get('/api/forms')
    assert resp.status_code == 200
    body = resp.json()
    assert 'forms' in body
    assert 'count' in body
    assert body['count'] == 0
    assert body['forms'] == []


@pytest.mark.asyncio
async def test_get_form_by_id_not_found(client: httpx.AsyncClient):
    """Test getting a form by ID when form doesn't exist (mocked)"""
    resp = await client.get('/api/forms/507f1f77bcf86cd799439011')  # Valid ObjectId format
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_parse_with_valid_excel_file(client: httpx.AsyncClient):
    """Test parsing a valid Excel file using local test files"""
    test_file_path = os.path.join(os.path.dirname(__file__), '..', 'test_xlsforms_valid', 'valid_form_1.xlsx')
    
    if os.path.exists(test_file_path):
        with open(test_file_path, 'rb') as f:
            files = {'file': ('valid_form_1.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            resp = await client.post('/api/forms/parse', files=files)
            # Should return parsed form data without saving to DB
            assert resp.status_code == 200
            body = resp.json()
            
            # New tempData.json format is an array containing form definitions
            assert isinstance(body, list)
            assert len(body) > 0
            
            form_definition = body[0]
            assert '_id' in form_definition
            assert 'formId' in form_definition
            assert 'version' in form_definition
            assert 'language' in form_definition
            assert 'question' in form_definition
            assert isinstance(form_definition['question'], list)
            assert 'language' in form_definition
            assert isinstance(form_definition['language'], list)
            
            # Check language array structure
            if form_definition['language']:
                lang_config = form_definition['language'][0]
                assert 'lng' in lang_config
                assert 'title' in lang_config
                assert 'question' in lang_config
                assert isinstance(lang_config['question'], list)
    else:
        # Skip test if no test file available
        pytest.skip("Test Excel file not found")


@pytest.mark.asyncio
async def test_validate_with_valid_excel_file(client: httpx.AsyncClient):
    """Test validation with a valid Excel file using local test files"""
    test_file_path = os.path.join(os.path.dirname(__file__), '..', 'test_xlsforms_valid', 'valid_form_1.xlsx')
    
    if os.path.exists(test_file_path):
        with open(test_file_path, 'rb') as f:
            files = {'file': ('valid_form_1.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            resp = await client.post('/api/validate', files=files)
            assert resp.status_code == 200
            body = resp.json()
            assert 'valid' in body
            assert 'message' in body
            assert 'sheets' in body
    else:
        # Skip test if no test file available
        pytest.skip("Test Excel file not found")

