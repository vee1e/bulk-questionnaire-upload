# Bulk questionnaire Upload

A web application for uploading and parsing Excel-based questionnaires in XLSForm-like format.

## Project Structure

```
│
├── frontend/
└── backend/
```

## Stack

### Frontend

- Angular 16+
- Material UI
- SCSS

### Backend

- Python FastAPI
- `openpyxl`/`pandas` for Excel parsing

## Setup Instructions

### Frontend Setup

1. Navigate to the `frontend/` directory
2. Run `npm install`
3. Run `ng serve` for development server

### Backend Setup

1. Navigate to the `backend/` directory
2. Create virtual environment: `python -m venv .env`
3. Activate virtual environment:
   - Windows: `.\.env\Scripts\activate`
   - Unix: `source .env/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run development server: `uvicorn main:app --reload`

