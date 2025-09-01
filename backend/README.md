# mForm Bulk Questionnaire Upload Backend

A comprehensive FastAPI backend for bulk Excel-based questionnaire uploads, featuring advanced validation, parsing, and storage capabilities. Designed for robust integration with the Angular frontend and built for extensibility.

## Architecture Overview

### Core Components

#### **Main Application (`main.py`)**
- **FastAPI Application**: Central application instance with comprehensive middleware
- **CORS Configuration**: Configured for Angular frontend integration
- **API Routes**: RESTful endpoints for file processing and form management
- **Lifecycle Management**: Startup/shutdown events for MongoDB connection handling
- **Metrics Logging**: Performance tracking and cold start monitoring
- **Error Handling**: Structured error responses with detailed suggestions

#### **Business Logic (`services/xlsform_parser.py`)**
- **Excel File Validation**: Comprehensive structural and content validation
- **Data Parsing**: XLSForm-compliant parsing with multiple question types
- **Cross-Reference Validation**: Ensures data consistency between sheets
- **Error Classification**: Detailed error categorization with actionable suggestions
- **Performance Optimization**: Concurrent processing for bulk uploads

#### **Database Layer (`services/database_service.py`)**
- **Async MongoDB Operations**: Full CRUD operations with error handling
- **Data Integrity**: Atomic operations and cascade deletions
- **Performance Tracking**: Database operation timing and metrics
- **Connection Management**: Proper resource handling and cleanup

#### **Data Models (`models/`)**
- **Pydantic Validation**: Request/response models with type safety
- **API Schemas**: Structured data contracts for frontend integration
- **Validation Models**: Comprehensive validation result structures

## API Reference

### File Processing Endpoints

#### **POST `/api/validate`**
Validates Excel file structure and content without processing.

**Request**: `multipart/form-data`
```python
file: UploadFile  # .xls or .xlsx file
```

**Response**:
    ```json
    {
      "valid": true,
      "message": "File format is valid.",
  "sheets": [
    {
      "name": "Forms",
      "exists": true,
      "columns": ["Language", "Title"],
      "required_columns": ["Language", "Title"],
      "missing_columns": [],
      "row_count": 1
    }
  ],
  "form_metadata": {
    "language": "en",
    "title": "Sample Form"
  },
  "questions_count": 5,
  "options_count": 15,
      "errors": [],
      "warnings": []
    }
    ```

#### **POST `/api/forms/parse`**
Parses Excel file and returns structured JSON schema without database storage.

**Request**: `multipart/form-data`
```python
file: UploadFile  # .xls or .xlsx file
```

**Response**:
    ```json
    {
      "id": null,
  "title": {"default": "Sample Questionnaire"},
  "version": "1.0.0",
      "language": "en",
  "groups": [
    {
      "name": "default",
      "label": {"default": "Default Group"},
      "questions": [
        {
          "type": "text",
          "name": "1",
          "label": {"default": "What is your name?"},
          "required": false,
          "choices": null
        }
      ]
    }
  ],
  "metadata": {
    "questions_count": 5,
    "options_count": 15,
    "parse_time": 0.082,
    "sheets_found": ["Forms", "Questions Info", "Answer Options"],
    "file_name": "questionnaire.xlsx",
    "validation_warnings": []
      }
    }
    ```

#### **POST `/api/upload`**
Processes and stores multiple Excel files concurrently.

**Request**: `multipart/form-data`
```python
files: List[UploadFile]  # Multiple .xls or .xlsx files
```

**Response**: Array of parsed form objects with database IDs and metadata.

### Form Management Endpoints

#### **GET `/api/forms`**
Retrieves all forms with summary information.

**Response**:
    ```json
{
  "forms": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Sample Form",
      "language": "en",
      "version": "1.0.0",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### **GET `/api/forms/{form_id}`**
Retrieves complete form data including questions and options.

**Response**:
    ```json
{
  "form": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Sample Form",
    "language": "en",
    "version": "1.0.0",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "questions": [
    {
      "id": "507f1f77bcf86cd799439012",
      "form_id": "507f1f77bcf86cd799439011",
      "order": 1,
      "title": "What is your name?",
      "view_sequence": 1,
      "input_type": 1,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "options": [...],
  "questions_count": 5,
  "options_count": 15
}
```

#### **PUT `/api/forms/{form_id}/update`**
Updates an existing form with new Excel file data.

**Request**: `multipart/form-data`
```python
file: UploadFile  # Updated .xls or .xlsx file
```

#### **DELETE `/api/forms/{form_id}`**
Deletes a form and all related questions and options.

#### **DELETE `/api/forms`**
Deletes all forms and related data (bulk operation).

## Data Models & Validation

### Core Data Structures

#### **Supported Question Types**
```python
SUPPORTED_QUESTION_TYPES = {
    1: 'text',           # Text input
    2: 'select_one',     # Single choice
    3: 'select_multiple', # Multiple choice
    4: 'integer',        # Whole numbers
    5: 'decimal',        # Decimal numbers
    6: 'date',           # Date picker
    7: 'time',           # Time picker
    8: 'datetime',       # Date and time
    9: 'note',           # Display text
    10: 'calculate'      # Computed value
}
```

#### **Validation Rules**

**Forms Sheet Requirements**:
- Required columns: `Language`, `Title`
- Supported languages: en, fr, es, de, it, pt, ar, zh, ja, ko, hi, ru
- Title length: ≤ 255 characters
- Only first row is processed

**Questions Info Sheet Requirements**:
- Required columns: `Order`, `Title`, `View Sequence`, `Input Type`
- Order: Positive integers, unique
- View Sequence: Positive integers
- Input Type: 1-10 (see supported types above)
- Title length: ≤ 1000 characters

**Answer Options Sheet Requirements**:
- Required columns: `Order`, `Id`, `Label`
- Order: Positive integers
- Id: Positive integers, unique per Order
- Label length: ≤ 500 characters

### Cross-Reference Validation
- Choice questions (types 2, 3) must have corresponding options
- All option orders must map to existing question orders
- No orphaned options without corresponding questions

## Database Schema

### Collections Overview

#### **forms**
```javascript
{
  _id: ObjectId,
  title: String,
  language: String,
  version: String,
  created_at: ISODate
}
```

#### **questions**
```javascript
{
  _id: ObjectId,
  form_id: String,
  order: Number,
  title: String,
  view_sequence: Number,
  input_type: Number,
  created_at: ISODate
}
```

#### **options**
```javascript
{
  _id: ObjectId,
  form_id: String,
  order: Number,
  option_id: Number,
  label: String,
  created_at: ISODate
}
```

### Indexes & Performance
- Forms: `{created_at: -1}` (recent forms first)
- Questions: `{form_id: 1}` (efficient form retrieval)
- Options: `{form_id: 1}` (efficient form retrieval)

## Configuration & Setup

### Environment Variables
   ```bash
# MongoDB Configuration
     MONGODB_URL=mongodb://localhost:27017
     DATABASE_NAME=mform_bulk_upload

# API Configuration
     API_HOST=0.0.0.0
     API_PORT=8000

# CORS Configuration
FRONTEND_URL=http://localhost:4200
```

### Installation
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Start the application
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Error Handling & Validation

### Error Classification System

#### **File-Level Errors**
- `MISSING_FILE`: No file uploaded
- `INVALID_FILE_FORMAT`: Wrong file extension or format
- `EMPTY_FILE`: Zero-byte file
- `FILE_ACCESS_ERROR`: Cannot read file content
- `CORRUPTED_FILE`: Invalid Excel structure

#### **Structure-Level Errors**
- `MISSING_SHEET`: Required sheet not found
- `MISSING_COLUMNS`: Required columns missing
- `EMPTY_SHEET`: Sheet contains no data

#### **Content-Level Errors**
- `INVALID_DATA_TYPE`: Wrong data type in cells
- `MISSING_VALUE`: Required field is empty
- `INVALID_VALUE`: Value outside acceptable range
- `DUPLICATE_VALUE`: Non-unique value where uniqueness required

#### **Cross-Reference Errors**
- `MISSING_REFERENCE`: Choice question without options
- `ORPHANED_REFERENCE`: Options without corresponding question

### Enhanced Error Responses
```json
{
  "detail": {
    "error": "Validation failed",
    "message": "Found 3 error(s) and 2 warning(s).",
    "error_type": "VALIDATION_ERROR",
    "file_name": "questionnaire.xlsx",
    "errors": [
      {
        "type": "missing_column",
        "message": "Required column 'Title' is missing",
        "location": "Forms sheet",
        "row": null,
        "column": "Title"
      }
    ],
    "warnings": [...],
    "suggestions": [
      "Ensure your Excel file contains sheets named: 'Forms', 'Questions Info', 'Answer Options'",
      "Check that all required columns are present in each sheet"
    ]
  }
}
```

## Performance & Monitoring

### Metrics Tracked
- **Validation Performance**: File validation times
- **Parse Performance**: Schema parsing without DB operations
- **Upload Performance**: Complete form processing with storage
- **Database Operations**: Individual CRUD operation times
- **Cold Start Time**: Application initialization duration
- **Batch Processing**: Multi-file upload performance

### Performance Optimizations
- **Concurrent Processing**: Async file processing with `asyncio.gather()`
- **Connection Pooling**: MongoDB connection reuse
- **Efficient Parsing**: Pandas DataFrame operations for large datasets
- **Memory Management**: File stream handling to prevent memory leaks

## Development & Extension Guide

### Adding New Features

#### **1. New API Endpoint**
```python
# main.py
@app.post("/api/forms/export/{form_id}")
async def export_form(form_id: str):
    # Implementation
    pass
```

#### **2. New Business Logic**
```python
# services/xlsform_parser.py
class XLSFormParser:
    def export_to_format(self, form_id: str, format: str) -> Dict[str, Any]:
        # Implementation
        pass
```

#### **3. New Database Operations**
```python
# services/database_service.py
class DatabaseService:
    async def export_form_data(self, form_id: str) -> Dict[str, Any]:
        # Implementation
        pass
```

#### **4. New Data Models**
```python
# models/export.py
from pydantic import BaseModel

class ExportRequest(BaseModel):
    format: str  # 'json', 'csv', 'xml'
    include_metadata: bool = True
```

### Testing Strategy

#### **Unit Tests**
```python
# Test individual components
def test_xlsform_parser_validation():
    parser = XLSFormParser()
    # Test validation logic

def test_database_service_operations():
    service = DatabaseService()
    # Test database operations
```

#### **Integration Tests**
```python
# Test complete workflows
def test_file_upload_workflow():
    # Test end-to-end file processing
    pass
```

### Code Quality Guidelines

#### **Error Handling**
- Use structured error responses with specific error types
- Include actionable suggestions in error messages
- Log errors with appropriate context
- Never expose sensitive information in error responses

#### **Performance**
- Use async/await for I/O operations
- Implement proper connection pooling
- Monitor and log performance metrics
- Optimize database queries with appropriate indexes

#### **Security**
- Validate all input data
- Use parameterized queries
- Implement proper CORS configuration
- Never log sensitive information

## Troubleshooting

### Common Issues

#### **MongoDB Connection Issues**
```python
# Check connection
from database import connect_to_mongo
await connect_to_mongo()
```

#### **File Processing Errors**
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### **Performance Issues**
```python
# Check metrics
with open('metrics.txt', 'r') as f:
    print(f.read())
```

### Debug Commands
   ```bash
# Check MongoDB collections
mongo mform_bulk_upload --eval "db.forms.count()"

# Test API endpoints
curl -X POST "http://localhost:8000/api/validate" -F "file=@test.xlsx"

# Monitor logs
tail -f logs/app.log
```

## Additional Resources

### Excel File Format Standards
- [XLSForm Specification](https://xlsform.org/)
- [ODK XForm Standards](https://docs.getodk.org/xform/)
- [Excel File Format Documentation](https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-xlsx/)

### API Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Models](https://pydantic-docs.helpmanual.io/)
- [MongoDB Python Driver](https://pymongo.readthedocs.io/)

### Development Tools
- [uvicorn](https://www.uvicorn.org/) - ASGI server
- [pandas](https://pandas.pydata.org/) - Data processing
- [openpyxl](https://openpyxl.readthedocs.io/) - Excel file handling

## Contributing

1. Follow the established code structure
2. Add comprehensive error handling
3. Include performance metrics for new operations
4. Update documentation for any API changes
5. Add tests for new functionality
6. Use meaningful commit messages

# Why you don't do compression with XLS/XLSX files

XLS and XLSX files are already compressed formats (especially XLSX, which is a ZIP archive of XML files). Applying additional co
pression (like gzip) typically results in minimal size reduction—often less than 3%. This extra step adds processing overhead wi
hout significant storage or transfer benefits. In most cases, it's more efficient to transfer these files as-is.

## Compression Metrics for XLSX Files

| File Name               | Compressed Size (bytes) | Decompressed Size (bytes)  | Compression Ratio | Bytes Saved |
|-------------------------|-------------------------|----------------------------|-------------------|-------------|
| `valid_form_07.xlsx.gz` | 37,009                  | 37,973                     | 2.5%              | 964         |
| `valid_form_08.xlsx.gz` | 38,975                  | 40,021                     | 2.6%              | 1,046       |
| `valid_form_09.xlsx.gz` | 37,341                  | 38,420                     | 2.8%              | 1,079       |
| `valid_form_10.xlsx.gz` | 37,269                  | 38,208                     | 2.5%              | 939         |

**Observation:**
The compression ratios are very low (2.5%–2.8%), saving only about 939–1,079 bytes per file. This demonstrates that compressing
LSX files provides negligible space savings.

To put this in perspective, this required refactoring half the codebase with over 5,000 changed lines of code.

## License

MIT License - see LICENSE file for details.

*For questions or support, please refer to the project documentation or create an issue in the repository.*
