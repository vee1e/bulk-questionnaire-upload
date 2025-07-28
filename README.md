# Bulk Questionnaire Upload

A web application for uploading and parsing Excel-based questionnaires in XLSForm-like format with MongoDB integration.

## Project Structure

```
│
├── frontend/          # Angular frontend application
├── backend/           # FastAPI backend with MongoDB
└── README.md
```

## Stack

### Frontend

- Angular 16+
- Material UI
- SCSS

### Backend

- Python FastAPI
- MongoDB for data persistence
- `openpyxl`/`pandas` for Excel parsing
- `motor`/`pymongo` for MongoDB integration

## Prerequisites

- Python 3.8+ (recommend using a virtual environment)
- Node.js 16+ and npm
- MongoDB (local or cloud instance)
- pip

## Installation & Setup

### 1. Install MongoDB (Artix/Arch Linux)

**Start MongoDB service:**
```bash
sudo rc-service mongodb start      # OpenRC (Artix default)
# or
sudo systemctl start mongodb      # If using systemd
mongosh --eval "db.runCommand('ping')"
# Should output: { ok: 1 }
```

### 2. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend/
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install --upgrade pip
   pip install --break-system-packages -r requirements.txt
   ```
   > If you see an "externally-managed-environment" error, use the `--break-system-packages` flag as above.

4. **Create environment configuration:**
   Create a `.env` file in the `backend/` directory:
   ```
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=mform_bulk_upload
   API_HOST=0.0.0.0
   API_PORT=8000
   ```

5. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at [http://localhost:8000](http://localhost:8000)

### 3. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend/
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   ng serve
   ```

   The frontend will be available at [http://localhost:4200](http://localhost:4200)

## API Endpoints

### File Validation
- **POST** `/api/validate`
  Validate Excel file structure.
  Returns detailed validation information including sheet status, metadata, and counts.

### File Upload
- **POST** `/api/upload`
  Parse and store Excel file in MongoDB.
  Saves form metadata, questions, and answer options to separate collections.

### Forms Management
- **GET** `/api/forms`
  Get all forms from database.
- **GET** `/api/forms/{form_id}`
  Get specific form with questions and options.
- **DELETE** `/api/forms/{form_id}`
  Delete form and all related data.

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

## Sample Performance Metrics Output

Below is a real example of metrics collected for uploading 10 forms (each with ~400 questions and 3-10 options per question) based on the latest performance data:

| Description                                      | Time                   |
| ------------------------------------------------ | ----------------------- |
| Time to validate each form file                  | 45.80-123.20ms (59.98ms) |
| Time to process and save one form                | 0.49-288.43ms (126.84ms) |
| Time to process and save all questions in a form | 59.64-82.80ms (64.59ms) |
| Average time to process one question             | 0.15-0.20ms (0.16ms) |
| Average time to process one option               | 0.15-0.17ms (0.16ms) |
| Time to process all forms in the batch           | 228.62-288.43ms (253.00ms) |
| Number of forms processed in the batch           | 10                      |
| Average time to process one form in the batch    | 228.62-288.43ms (253.00ms) |

**Notes:**
- Metrics collected from backend/metrics.txt on 2025-07-28
- All times are in ms unless specified otherwise
- Hardware used is an M3 Pro Macbook Pro, with 18GB unified memory and 512GB of storage.

