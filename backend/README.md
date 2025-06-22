# mForm Bulk Upload Backend

A FastAPI backend for parsing and storing Excel form data in MongoDB.

## Prerequisites

- Python 3.8+
- MongoDB (local or cloud instance)
- pip

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up MongoDB:
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database named `mform_bulk_upload`

3. Environment Configuration:
   Create a `.env` file in the backend directory:
   ```
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=mform_bulk_upload
   ```

## Running the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### File Validation
- **POST** `/api/validate` - Validate Excel file structure
  - Returns detailed validation information including sheet status, metadata, and counts

### File Upload
- **POST** `/api/upload` - Parse and store Excel file in MongoDB
  - Saves form metadata, questions, and answer options to separate collections

### Forms Management
- **GET** `/api/forms` - Get all forms from database
- **GET** `/api/forms/{form_id}` - Get specific form with questions and options
- **DELETE** `/api/forms/{form_id}` - Delete form and all related data

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

## Excel File Structure

The application expects Excel files with three sheets:

1. **Forms** - Form metadata
   - Columns: Language, Title

2. **Questions Info** - Question definitions
   - Columns: Order, Title, View Sequence, Input Type

3. **Answer Options** - Answer choices for questions
   - Columns: Order, Id, Label

## Features

- ✅ Excel file validation with detailed feedback
- ✅ MongoDB integration for data persistence
- ✅ RESTful API endpoints
- ✅ Error handling and logging
- ✅ CORS support for frontend integration 