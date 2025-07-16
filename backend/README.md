# mForm Bulk Upload Backend

A FastAPI backend for validating, parsing, and storing Excel-based form data in MongoDB. Designed for robust integration with the Angular frontend and easy extensibility.

---

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Excel File Requirements](#excel-file-requirements)
- [Setup & Installation](#setup--installation)
- [Error Handling & Logging](#error-handling--logging)
- [Development & Maintenance Tips](#development--maintenance-tips)
- [Extending the Backend](#extending-the-backend)

---

## Overview
This backend provides:
- Validation of Excel files for correct structure and content
- Parsing and storage of forms, questions, and answer options in MongoDB
- RESTful API endpoints for form management
- Detailed error handling and logging
- CORS support for seamless frontend integration

---

## Architecture

**Main Components:**
- `main.py`: FastAPI app, API routes, startup/shutdown events, CORS, and metrics logging
- `services/xlsform_parser.py`: Business logic for validating and parsing Excel files
- `services/database_service.py`: Async database operations for forms, questions, and options
- `database.py`: MongoDB connection management and collection handles
- `models/`: Pydantic models for validation, API responses, and internal data structures

**Startup Flow:**
- Loads environment variables from `.env`
- Connects to MongoDB on startup, closes on shutdown
- Exposes API endpoints under `/api/`

---

## API Endpoints

### File Validation
- **POST** `/api/validate`
  - **Description:** Validate Excel file structure and content
  - **Request:** `multipart/form-data` with a single file field
  - **Response:**
    ```json
    {
      "valid": true,
      "message": "File format is valid.",
      "sheets": [...],
      "form_metadata": {...},
      "questions_count": 10,
      "options_count": 30,
      "errors": [],
      "warnings": []
    }
    ```

### File Upload
- **POST** `/api/upload`
  - **Description:** Parse and store one or more Excel files
  - **Request:** `multipart/form-data` with one or more files
  - **Response:** List of parsed form objects or error details

### Forms Management
- **GET** `/api/forms`
  - **Description:** List all forms
  - **Response:** `{ "forms": [...], "count": 2 }`

- **GET** `/api/forms/{form_id}`
  - **Description:** Get a form with its questions and options
  - **Response:**
    ```json
    {
      "form": {...},
      "questions": [...],
      "options": [...],
      "questions_count": 10,
      "options_count": 30
    }
    ```

- **DELETE** `/api/forms/{form_id}`
  - **Description:** Delete a form and all related data
  - **Response:** `{ "message": "Form deleted successfully" }`

- **DELETE** `/api/forms`
  - **Description:** Delete all forms and related data
  - **Response:** `{ "message": "All forms deleted successfully" }`

---

## Database Schema

### Forms Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "language": "string",
  "version": "string",
  "created_at": "ISO timestamp"
}
```

### Questions Collection
```json
{
  "_id": "ObjectId",
  "form_id": "string",
  "order": "number",
  "title": "string",
  "view_sequence": "number",
  "input_type": "number",
  "created_at": "ISO timestamp"
}
```

### Options Collection
```json
{
  "_id": "ObjectId",
  "form_id": "string",
  "order": "number",
  "option_id": "number",
  "label": "string",
  "created_at": "ISO timestamp"
}
```

---

## Excel File Requirements

The backend expects Excel files with **three sheets**:
1. **Forms**
   - Columns: `Language`, `Title`
2. **Questions Info**
   - Columns: `Order`, `Title`, `View Sequence`, `Input Type`
3. **Answer Options**
   - Columns: `Order`, `Id`, `Label`

Validation will fail if required sheets or columns are missing.

---

## Setup & Installation

### Prerequisites
- Python 3.8+
- MongoDB (local or cloud instance)
- pip

### Installation Steps
1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Set up MongoDB:**
   - Install locally or use MongoDB Atlas
   - Create a database named `mform_bulk_upload`
3. **Environment Configuration:**
   - Create a `.env` file in the backend directory:
     ```
     MONGODB_URL=mongodb://localhost:27017
     DATABASE_NAME=mform_bulk_upload
     ```
4. **Run the application:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

---

## Error Handling & Logging
- All API endpoints use structured error handling with FastAPI's `HTTPException`.
- Errors and warnings during file validation are returned in the API response.
- Application-level errors are logged using Python's `logging` module (see `main.py`, `services/`).
- Metrics (e.g., processing times, counts) are logged to `metrics.txt` for performance monitoring.
- Database errors are caught and logged; user-facing errors are returned with appropriate HTTP status codes.

---

## Development & Maintenance Tips
- **Centralize logic:** All business logic is in `services/`, and all DB access in `database_service.py`.
- **Environment variables:** Use `.env` for DB config; never hardcode secrets.
- **Testing:** Use tools like `httpie` or Postman to test endpoints.
- **Extending:** Add new endpoints in `main.py` and corresponding logic in `services/`.
- **Logging:** Check `metrics.txt` and logs for troubleshooting and performance analysis.
- **CORS:** Update allowed origins in `main.py` if frontend URL changes.

---

## Extending the Backend
- **Add new endpoints:** Define in `main.py`, implement logic in `services/`, and update models as needed.
- **Add new collections:** Update `database.py` and `database_service.py` for new MongoDB collections.
- **Validation:** Extend `XLSFormParser` for new validation rules or file formats.
- **Documentation:** Update this README and docstrings in code for any new features or changes.

---

## License
MIT
