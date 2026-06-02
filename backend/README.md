# Backend

FastAPI service that validates, parses, and stores XLSForm-compatible Excel files. Deployed on Render.

## Local Setup

```bash
cd backend/
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | — | Full MongoDB connection string |
| `DATABASE_NAME` | `mform_bulk_upload` | Database name |
| `FRONTEND_URL` | `*` | Allowed CORS origin(s), comma-separated |

## API Reference

### POST `/api/validate`
Validate an Excel file's structure without storing anything.

**Request:** `multipart/form-data` — field `file` (.xls / .xlsx)

**Response:**
```json
{
  "valid": true,
  "message": "File format is valid.",
  "sheets": [{ "name": "Forms", "exists": true, "missing_columns": [] }],
  "form_metadata": { "language": "en", "title": "My Form" },
  "questions_count": 5,
  "options_count": 15,
  "errors": [],
  "warnings": []
}
```

### POST `/api/forms/parse`
Parse an Excel file and return the full tempData JSON without saving to the database.

**Request:** `multipart/form-data` — field `file`

**Response:** Array — `[questionnaireResponse, formDefinition]`

### POST `/api/upload`
Parse and store one or more Excel files concurrently.

**Request:** `multipart/form-data` — field `files` (multiple)

**Response:** Array of stored form objects in tempData format.

### GET `/api/forms`
List all stored forms.
```json
{ "forms": [{ "id": "...", "title": "...", "language": "en", "version": "1.0", "created_at": "..." }], "count": 1 }
```

### GET `/api/forms/{form_id}`
Retrieve a single form in full tempData format.

### PUT `/api/forms/{form_id}/update`
Replace a form's data with a new Excel file. `multipart/form-data` — field `file`.

### DELETE `/api/forms/{form_id}`
Delete one form and all its questions and options.

### DELETE `/api/forms`
Delete all forms (bulk).

## File Format

Three sheets are required:

### Forms
| Column | Required | Notes |
|--------|----------|-------|
| Language | Yes | ISO 639-1 code (en, fr, es, …) |
| Title | Yes | ≤ 255 characters |
| Version | No | Arbitrary string |
| (others) | No | Extracted dynamically with defaults |

### Questions Info
| Column | Required | Notes |
|--------|----------|-------|
| Order | Yes | Positive integer, unique |
| Title | Yes | ≤ 1000 characters |
| View Sequence | Yes | Positive integer |
| Input Type | Yes | 1–10 (see below) |

### Answer Options
| Column | Required | Notes |
|--------|----------|-------|
| Order | Yes | References a question Order |
| Id | Yes | Positive integer, unique per Order |
| Label | Yes | ≤ 500 characters |

### Question Types
| Code | Type |
|------|------|
| 1 | text |
| 2 | select_one |
| 3 | select_multiple |
| 4 | integer |
| 5 | decimal |
| 6 | date |
| 7 | time |
| 8 | datetime |
| 9 | note |
| 10 | calculate |

Choice questions (types 2, 3) must have matching Answer Options rows. Orphaned options (no matching question) are a validation error.

## Database Schema

**forms** `{ _id, title, language, version, created_at }`  
**questions** `{ _id, form_id, order, title, view_sequence, input_type, created_at }`  
**options** `{ _id, form_id, order, option_id, label, created_at }`

Indexes: `forms.created_at desc`, `questions.form_id`, `options.{form_id, order}`.

## Testing

```bash
# Unit + integration (mocked MongoDB)
pytest tests/backend -q

# Against live deployment (saves perf_results.json)
BACKEND_URL=https://bulk-questionnaire-upload.onrender.com python scripts/measure_perf.py
```

Test fixtures: `tests/test_xlsforms_valid/` (10 valid files) · `tests/test_xlsforms_incorrect/` (error scenarios).
