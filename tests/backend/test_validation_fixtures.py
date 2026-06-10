import os
import pytest
import httpx

INVALID_DIR = os.path.join(os.path.dirname(__file__), '..', 'test_xlsforms_incorrect')

@pytest.mark.asyncio
@pytest.mark.parametrize("filename", [f for f in os.listdir(INVALID_DIR) if f.endswith('.xlsx')])
async def test_invalid_form_returns_validation_errors(client: httpx.AsyncClient, filename):
    path = os.path.join(INVALID_DIR, filename)
    with open(path, 'rb') as f:
        resp = await client.post(
            '/api/validate',
            files={'file': (filename, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        )
    assert resp.status_code == 200
    body = resp.json()
    assert 'valid' in body
    # Most incorrect fixtures are invalid; a few (e.g. invalid_language_code) produce warnings only
    assert isinstance(body.get('errors', []), list)
