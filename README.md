# Bulk Questionnaire Upload System

A comprehensive full-stack web application for bulk uploading, validating, parsing, and managing Excel-based questionnaires in XLSForm-compatible format. The system provides a modern Angular frontend with a powerful FastAPI backend and MongoDB for data persistence.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [File Format Specifications](#file-format-specifications)
- [Performance Characteristics](#performance-characteristics)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Development Guidelines](#development-guidelines)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Future Enhancements](#future-enhancements)

## Overview

This application enables organizations to efficiently manage questionnaire forms through Excel file uploads. It supports XLSForm-like format with three-sheet structure (Forms, Questions Info, Answer Options) and provides comprehensive validation, parsing, and storage capabilities.

### Key Features

- **Bulk File Upload**: Process multiple Excel files simultaneously with progress tracking
- **Comprehensive Validation**: Structural and content validation with detailed error reporting
- **Schema Parsing**: Convert Excel files to structured JSON schemas
- **Form Management**: CRUD operations for stored forms with metadata tracking
- **Real-time Progress**: Visual feedback during file processing operations
- **Dark Theme UI**: Modern Angular Material interface with accessibility support
- **Performance Monitoring**: Built-in metrics collection and analysis
- **Keyboard Shortcuts**: Power-user features for efficient navigation
- **Server-Side Rendering**: SEO-friendly with fast initial page loads

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Angular Frontend                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Components: Upload, Search, Navbar            │   │
│  │  Services: FormService, FormPreviewService     │   │
│  │  Features: Drag & Drop, Progress Tracking      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON API
                              │
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Core: main.py (FastAPI app, CORS, middleware) │   │
│  │  Business Logic: xlsform_parser.py              │   │
│  │  Data Access: database_service.py               │   │
│  │  Models: Pydantic validation models             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB Driver
                              │
┌─────────────────────────────────────────────────────────┐
│                     MongoDB Database                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Collections: forms, questions, options         │   │
│  │  Features: Async operations, indexing           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **File Upload**: User selects Excel files via drag & drop or file picker
2. **Validation**: Frontend sends files to backend for structural validation
3. **Parsing**: Valid files are parsed into JSON schema format
4. **Storage**: Parsed data is stored in MongoDB collections
5. **Management**: Users can view, update, and delete stored forms

## Technology Stack

### Frontend

- **Framework**: Angular 19 with standalone components
- **UI Library**: Angular Material with custom dark theme
- **Styling**: SCSS with CSS custom properties
- **Build Tool**: Angular CLI with SSR support
- **Testing**: Vitest with jsdom environment
- **HTTP Client**: Angular HttpClient with fetch API
- **State Management**: RxJS observables with service-based architecture

### Backend

- **Framework**: FastAPI with async/await support
- **Web Server**: Uvicorn ASGI server
- **Data Processing**: Pandas for Excel parsing, OpenPyXL for file handling
- **Database**: MongoDB with Motor async driver
- **Validation**: Pydantic models with comprehensive error handling
- **Documentation**: Auto-generated OpenAPI/Swagger UI
- **CORS**: Configured for Angular frontend integration

### Database

- **Engine**: MongoDB with document-based storage
- **Collections**: Separate collections for forms, questions, and options
- **Indexing**: Optimized indexes for efficient querying
- **Connection**: Async connection pooling with proper lifecycle management

### Development Tools

- **Version Control**: Git with structured commit messages
- **Environment**: Python virtual environments, Node.js nvm
- **Testing**: pytest for backend, Vitest for frontend
- **Linting**: ESLint for frontend, pre-commit hooks
- **Documentation**: Markdown-based documentation with auto-generation

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL
- **Python**: 3.8+ (3.9+ recommended)
- **Node.js**: 18+ with npm
- **MongoDB**: 5.0+ (local installation or cloud instance)
- **Memory**: 4GB+ RAM recommended
- **Storage**: 1GB+ free space

### Development Tools

- **Git**: For version control
- **curl**: For API testing (optional)
- **tmux**: For running frontend/backend simultaneously (optional)

## Installation & Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd bulk-questionnaire-upload
```

### 2. MongoDB Setup

**For local MongoDB installation:**

```bash
# Linux (systemd)
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Linux (OpenRC)
sudo rc-service mongodb start

# macOS (Homebrew)
brew services start mongodb-community

# Verify connection
mongosh --eval "db.runCommand('ping')"
```

**For MongoDB Atlas (cloud):**
1. Create account at mongodb.com/atlas
2. Create cluster and get connection string
3. Update `.env` file with cloud connection string

### 3. Backend Setup

   ```bash
   cd backend/

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate     # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
# Edit .env with your MongoDB settings
```

### 4. Frontend Setup

   ```bash
cd frontend/

# Install dependencies
npm install

# Verify installation
npm --version
ng version
```

### 5. Start Development Environment

**Using provided script (recommended):**
   ```bash
# From project root
./run.sh
```

**Manual startup:**
```bash
# Terminal 1 - Backend
cd backend/
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend/
ng serve --host 0.0.0.0 --port 4200
```

### 6. Verify Installation

- **Backend API**: http://localhost:8000/docs (Swagger UI)
- **Frontend App**: http://localhost:4200
- **MongoDB**: Check collections created in database

## Configuration

### Backend Configuration

**Environment Variables** (`.env` file):
```bash
# MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=mform_bulk_upload

# API Configuration
   API_HOST=0.0.0.0
   API_PORT=8000

# CORS Configuration
FRONTEND_URL=http://localhost:4200

# Optional: Performance tuning
MAX_WORKERS=4
TIMEOUT=30
```

### Frontend Configuration

**Angular Configuration** (`src/app/app.config.ts`):
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(withFetch())
  ]
};
```

**API Service Configuration** (`src/app/services/form.service.ts`):
```typescript
private readonly apiUrl = 'http://localhost:8000/api';
```

## API Reference

### File Processing Endpoints

#### POST `/api/validate`
Validates Excel file structure and content without processing.

**Request**: `multipart/form-data`
```typescript
{
  file: UploadFile  // .xls or .xlsx file
}
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

#### POST `/api/forms/parse`
Parses Excel file and returns structured JSON schema without database storage.

**Request**: `multipart/form-data`
```typescript
{
  file: UploadFile  // .xls or .xlsx file
}
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

#### POST `/api/upload`
Processes and stores multiple Excel files concurrently.

**Request**: `multipart/form-data`
```typescript
{
  files: UploadFile[]  // Multiple .xls or .xlsx files
}
```

**Response**: Array of parsed form objects with database IDs and metadata.

### Form Management Endpoints

#### GET `/api/forms`
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

#### GET `/api/forms/{form_id}`
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

#### PUT `/api/forms/{form_id}/update`
Updates an existing form with new Excel file data.

**Request**: `multipart/form-data`
```typescript
{
  file: UploadFile  // Updated .xls or .xlsx file
}
```

#### DELETE `/api/forms/{form_id}`
Deletes a form and all related questions and options.

#### DELETE `/api/forms`
Deletes all forms and related data (bulk operation).

## Database Schema

### Collections Overview

#### forms
```javascript
{
  _id: ObjectId,
  title: String,
  language: String,
  version: String,
  created_at: ISODate
}
```

#### questions
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

#### options
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
- **Forms**: `{created_at: -1}` (recent forms first)
- **Questions**: `{form_id: 1}` (efficient form retrieval)
- **Options**: `{form_id: 1}` (efficient form retrieval)
- **Compound Index**: `{form_id: 1, order: 1}` (ordered retrieval)

### Data Relationships
- Forms contain multiple questions (1:N)
- Questions contain multiple options (1:N)
- Choice questions (types 2, 3) must have corresponding options
- All option orders must map to existing question orders

## File Format Specifications

### Excel Structure Requirements

**Forms Sheet**:
- Required columns: `Language`, `Title`
- Supported languages: en, fr, es, de, it, pt, ar, zh, ja, ko, hi, ru
- Title length: ≤ 255 characters
- Only first row is processed

**Questions Info Sheet**:
- Required columns: `Order`, `Title`, `View Sequence`, `Input Type`
- Order: Positive integers, unique within form
- View Sequence: Positive integers for display ordering
- Input Type: 1-10 (see supported types below)
- Title length: ≤ 1000 characters

**Answer Options Sheet**:
- Required columns: `Order`, `Id`, `Label`
- Order: References question order
- Id: Positive integers, unique per Order
- Label length: ≤ 500 characters

### Supported Question Types
```typescript
{
  1: 'text',           // Text input
  2: 'select_one',     // Single choice
  3: 'select_multiple', // Multiple choice
  4: 'integer',        // Whole numbers
  5: 'decimal',        // Decimal numbers
  6: 'date',           // Date picker
  7: 'time',           // Time picker
  8: 'datetime',       // Date and time
  9: 'note',           // Display text
  10: 'calculate'      // Computed value
}
```

### Validation Rules
- Choice questions (types 2, 3) must have corresponding options
- All option orders must map to existing question orders
- No orphaned options without corresponding questions
- Data types must match column requirements
- Required fields cannot be empty or null

## Performance Characteristics

### Performance Metrics Table

The system automatically collects performance metrics in `backend/metrics.txt`. Below is the current performance data from recent testing (August 25-26, 2025):

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 2-3ms (0.002-0.003s) |
| **Form Parsing** | 188-288ms (0.188-0.288s) |
| **Form Upload** | 207-238ms (0.207-0.238s) |
| **Question Processing** | 0.142-0.183ms per question |
| **Option Processing** | 0.143-0.158ms per option |
| **Batch Processing** | 222.08-281.11ms (10 forms) |
| **Cold Start Time** | Tracked on startup |

### Recent Testing Activity (Last 240 Lines Analysis)

| Time Period | Activity Type | Performance Range | Notes |
|-------------|----------------|-------------------|--------|
| **Aug 25, 18:57-20:22** | Cold Startups | Multiple events | System restart tracking |
| **Aug 26, 00:06-00:20** | Intensive Testing | Sequential operations | Active performance testing |
| **Validation Operations** | Form validation | 47-50ms range | Rapid sequential validations |
| **Parse Operations** | Schema parsing | 207-238ms range | Parse-only testing |

### Performance Summary

| Aspect | Details |
|--------|---------|
| **Validation Speed** | 2-3ms range for recent operations |
| **Parse Performance** | 200-300ms range, room for optimization |
| **Memory Management** | File streaming prevents memory leaks |
| **Concurrent Processing** | Async operations with `asyncio.gather()` |
| **Database Operations** | Optimized with compound indexes |
| **Metrics Collection** | Detailed performance tracking |

### Performance Optimizations
- **Concurrent Processing**: Async file processing with `asyncio.gather()`
- **Connection Pooling**: MongoDB connection reuse
- **Efficient Parsing**: Pandas DataFrame operations for large datasets
- **Memory Management**: File stream handling to prevent memory leaks
- **Database Indexing**: Optimized queries with compound indexes

### Scalability Considerations
- **Horizontal Scaling**: Stateless backend supports multiple instances
- **Database Sharding**: MongoDB sharding for large datasets
- **Caching Layer**: Redis for frequently accessed forms
- **CDN Integration**: Static asset optimization for global distribution

## Testing Strategy

### Backend Testing

**Unit Tests** (`tests/backend/`):
```python
# Test individual components
def test_xlsform_parser_validation():
    parser = XLSFormParser()
    # Test validation logic

def test_database_service_operations():
    service = DatabaseService()
    # Test database operations
```

**Integration Tests**:
```python
# Test complete workflows
def test_file_upload_workflow():
    # Test end-to-end file processing
    pass
```

**Test Configuration** (`pytest.ini`):
```ini
[tool:pytest]
filterwarnings =
    ignore::DeprecationWarning:fastapi.openapi.models
    ignore::DeprecationWarning:fastapi.datastructures
```

### Frontend Testing

**Vitest Configuration** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/frontend/**/*.spec.ts'],
    globals: true
  }
})
```

**Test Structure**:
- **form.service.spec.ts** - API service testing
- Unit tests for components and services
- Integration tests for critical user flows
- E2E test coverage for upload workflows

### Test Data
- **Valid Forms**: `tests/test_xlsforms_valid/` - 10 sample valid Excel files
- **Invalid Forms**: `tests/test_xlsforms_incorrect/` - Various error scenarios
- **Edge Cases**: Boundary conditions and error handling

## Deployment

### Development Deployment
```bash
# Using provided script
./run.sh  # Starts both frontend and backend in tmux
```

### Production Deployment

**Backend Deployment**:
```bash
# Install production dependencies
pip install -r requirements.txt

# Use production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend Deployment**:
```bash
# Build for production
npm run build

# Output in dist/mform-upload/
# Serve with any static file server
```

### Docker Deployment
```dockerfile
# Backend
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend
FROM nginx:alpine
COPY frontend/dist/mform-upload/ /usr/share/nginx/html
EXPOSE 80
```

### Environment-Specific Configuration
- **Development**: Hot reload, debug logging, local database
- **Staging**: Production build, staging database, monitoring
- **Production**: Optimized build, production database, SSL/TLS

## Development Guidelines

### Code Organization

**Backend Structure**:
```
backend/
├── main.py                 # FastAPI application
├── database.py            # Database connection
├── services/
│   ├── xlsform_parser.py  # Business logic
│   └── database_service.py # Data access
├── models/
│   └── form.py           # Pydantic models
├── requirements.txt       # Dependencies
└── metrics.txt           # Performance metrics
```

**Frontend Structure**:
```
frontend/
├── src/app/
│   ├── components/       # UI components
│   ├── services/        # API and state services
│   ├── models/          # TypeScript interfaces
│   └── styles.scss      # Global styles
├── public/              # Static assets
└── package.json         # Dependencies
```

### Coding Standards

**Python (Backend)**:
- Use type hints for all function parameters and return values
- Follow PEP 8 style guidelines
- Use async/await for I/O operations
- Implement comprehensive error handling
- Add docstrings for all public functions

**TypeScript (Frontend)**:
- Use strict TypeScript configuration
- Implement proper interface definitions
- Use Angular style guide conventions
- Follow RxJS best practices for observables
- Implement proper error handling in services

### Error Handling

**Structured Error Responses**:
```json
{
  "detail": {
    "error": "Validation failed",
    "message": "Found 3 error(s) and 2 warning(s).",
    "error_type": "VALIDATION_ERROR",
    "file_name": "questionnaire.xlsx",
    "errors": [...],
    "warnings": [...],
    "suggestions": [...]
  }
}
```

**Error Classification System**:
- File-level errors (MISSING_FILE, INVALID_FORMAT, etc.)
- Structure-level errors (MISSING_SHEET, MISSING_COLUMNS, etc.)
- Content-level errors (INVALID_DATA_TYPE, MISSING_VALUE, etc.)
- Cross-reference errors (MISSING_REFERENCE, ORPHANED_REFERENCE)

### Security Considerations

**Input Validation**:
- Validate all file uploads and form data
- Implement file type and size restrictions
- Sanitize Excel file content before processing

**API Security**:
- CORS configuration for frontend origin
- Input validation with Pydantic models
- Error message sanitization (no sensitive data exposure)

**Database Security**:
- Connection string encryption in production
- Proper authentication and authorization
- Input sanitization to prevent injection attacks

## Troubleshooting

### Common Issues

**MongoDB Connection Issues**:
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Test connection
python -c "from database import connect_to_mongo; connect_to_mongo()"

# Reset database
mongo mform_bulk_upload --eval "db.dropDatabase()"
```

**File Processing Errors**:
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Test with sample file
curl -X POST "http://localhost:8000/api/validate" -F "file=@test.xlsx"
```

**Performance Issues**:
```bash
# Check metrics
cat backend/metrics.txt | tail -20

# Monitor system resources
top -p $(pgrep -f uvicorn)
```

### Debug Commands

```bash
# Check MongoDB collections
mongosh mform_bulk_upload --eval "db.forms.count()"

# Test API endpoints
curl -X GET "http://localhost:8000/api/forms"
curl -X POST "http://localhost:8000/api/validate" -F "file=@sample.xlsx"

# Frontend debugging
ng serve --configuration development --verbose

# Backend debugging
uvicorn main:app --reload --log-level debug
```

### Performance Tuning

**Database Optimization**:
```javascript
// Create indexes
db.forms.createIndex({created_at: -1})
db.questions.createIndex({form_id: 1})
db.options.createIndex({form_id: 1, order: 1})
```

**Memory Management**:
- Monitor file upload sizes
- Implement file cleanup after processing
- Use streaming for large file processing

## Contributing

### Development Workflow

1. **Fork and Clone**: Fork the repository and clone locally
2. **Create Feature Branch**: `git checkout -b feature/new-feature`
3. **Make Changes**: Implement your feature with tests
4. **Run Tests**: Ensure all tests pass locally
5. **Commit Changes**: Use conventional commit messages
6. **Push and Create PR**: Push branch and create pull request

### Commit Message Guidelines

```
feat: add new API endpoint for form export
fix: resolve validation error for empty sheets
docs: update API documentation for new endpoints
test: add unit tests for database service
refactor: improve error handling in file parser
```

### Pull Request Process

1. **Description**: Provide clear description of changes
2. **Testing**: Include tests for new functionality
3. **Documentation**: Update documentation if needed
4. **Review**: Address reviewer feedback
5. **Merge**: Squash and merge after approval

### Code Review Checklist

- [ ] Code follows established patterns and conventions
- [ ] Comprehensive error handling implemented
- [ ] Performance metrics added for new operations
- [ ] Documentation updated for API changes
- [ ] Tests added for new functionality
- [ ] Security considerations addressed

## Future Enhancements

### Potential Improvements

1. **File Type Support**
   - Add CSV, JSON import capabilities
   - Support for Google Sheets integration
   - Template-based form creation

2. **Real-time Collaboration**
   - Multi-user form editing
   - Real-time synchronization
   - Version control for forms

3. **Advanced Analytics**
   - Form usage statistics and insights
   - Performance analytics dashboard
   - Export analytics data

4. **Template System**
   - Pre-built form templates
   - Template marketplace
   - Custom template creation tools

5. **Export Options**
   - Additional export formats (PDF, XML, CSV)
   - Custom export configurations
   - Batch export functionality

6. **Offline Mode**
   - Full offline capability with sync
   - Progressive Web App (PWA) features
   - Service worker implementation

7. **Internationalization**
   - Multi-language support for interface
   - RTL language support
   - Localization framework integration

8. **Performance Monitoring**
   - Application performance tracking
   - User behavior analytics
   - Real-time performance dashboards

### Technical Debt & Refactoring

1. **Code Quality**
   - Implement comprehensive test coverage
   - Add type hints throughout codebase
   - Refactor legacy code patterns

2. **Architecture Improvements**
   - Implement microservices architecture
   - Add message queue for async processing
   - Implement caching layer

3. **User Experience**
   - Implement progressive disclosure
   - Add keyboard shortcuts and accessibility
   - Improve error messaging and user feedback

### Integration Opportunities

1. **Third-party Services**
   - Integration with form builders (Typeform, Google Forms)
   - API integrations with survey platforms
   - Data warehouse integrations

2. **Cloud Services**
   - AWS S3 for file storage
   - Cloud functions for processing
   - CDN for static assets

3. **Monitoring & Logging**
   - Application monitoring (DataDog, New Relic)
   - Centralized logging (ELK stack)
   - Error tracking (Sentry)

### Research & Development

1. **Emerging Technologies**
   - Machine learning for form analysis
   - AI-powered form validation
   - Natural language processing for question generation

2. **Scalability Research**
   - Distributed processing architectures
   - Edge computing for global distribution
   - Serverless deployment models

---

This documentation provides comprehensive guidance for understanding, maintaining, and extending the Bulk Questionnaire Upload System. For questions or support, please refer to the project documentation or create an issue in the repository.
