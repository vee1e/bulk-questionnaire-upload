# mForm Bulk Upload Frontend

## About the Frontend

This frontend is a modern Angular application for bulk uploading, validating, parsing, and managing questionnaire forms (in Excel format). It provides a user-friendly interface for users to drag-and-drop or browse files, validate them, parse them for preview, upload them to the backend, and view/manage parsed forms and their details.

### Main Features
- **Bulk Upload**: Drag-and-drop or select multiple Excel files for upload.
- **Parse Only**: Parse Excel files to preview JSON schema without saving to database.
- **Validation**: Validate all selected files before uploading to ensure correct format and content.
- **Form Management**: View a list of all uploaded forms, search by title, and delete individual or all forms.
- **Form Details**: Click on a form to view its questions, options, and metadata in a modal dialog.
- **Schema Viewer**: Interactive modal for viewing parsed form schemas with structured display.
- **Update Form**: Update an existing form by selecting a new Excel file, preserving its ID and history.
- **Responsive UI**: Built with Angular Material for a clean, modern, and responsive user experience.
- **Progress Tracking**: Real-time progress bars for validation, parsing, uploading, and deletion operations.
- **Error Handling**: Comprehensive error messages with suggestions for fixing issues.

### Key Components
- **Navbar**: Displays the application title and navigation bar.
- **Search**: Allows searching forms by title.
- **Upload**: Handles file selection, validation, parsing, upload, and displays the list of forms and their details.

### Project Structure
- `src/app/components/navbar/` - Navigation bar component
- `src/app/components/search/` - Search bar component
- `src/app/components/upload/` - Main upload and form management component
- `src/app/services/` - Services for form parsing, preview, and backend API communication
- `src/app/models/` - TypeScript interfaces for form and question data

# Backend Integration Points

This document outlines where and how the frontend communicates with the backend API for easy maintenance and future updates.

## Main Integration Service

### FormService (`src/app/services/form.service.ts`)
This Angular service encapsulates all HTTP communication with the backend API. It is the single source of truth for API endpoints used by the frontend.

**Endpoints Used:**
- `POST /api/validate` — Validate a form file before upload
- `POST /api/forms/parse` — Parse Excel file and return JSON schema without saving
- `POST /api/upload` — Upload a form file (single or multiple)
- `GET /api/forms` — Fetch all uploaded forms
- `GET /api/forms/:formId` — Fetch details for a specific form
- `PUT /api/forms/:formId/update` — Update a specific form with a new file
- `DELETE /api/forms/:formId` — Delete a specific form
- `DELETE /api/forms` — Delete all forms

**Service Methods:**
- `validateFile(file: File)`
- `parseFile(file: File)`
- `uploadFile(file: File)`
- `uploadFiles(files: File[])`
- `getAllForms()`
- `getFormById(formId: string)`
- `updateForm(formId: string, file: File)`
- `deleteForm(formId: string)`
- `deleteAllForms()`

## Components Using Backend Integration

### UploadComponent (`src/app/components/upload/upload.component.ts`)
- Uses FormService to:
  - Validate files before upload
  - Parse files for schema preview
  - Upload files
  - Fetch the list of forms
  - Update a form with a new file (update button, file picker, and update logic)
  - Delete individual forms
  - Delete all forms
  - Fetch form details for preview

### Schema Viewer Modal
- Interactive modal component for viewing parsed schemas
- Displays form metadata, questions structure, and raw JSON
- Provides copy to clipboard and download functionality
- Keyboard shortcuts (ESC to close)

### NavbarComponent (`src/app/components/navbar/navbar.component.ts`)
- Indirectly uses backend data via FormPreviewService, which is populated by UploadComponent using FormService.

## How to Update Backend Endpoints
- All backend API URLs are defined in FormService as apiUrl.
- To change the backend base URL or endpoints, update FormService accordingly.
- If new endpoints are added to the backend, add corresponding methods to FormService and use them in components as needed.

## Maintenance Tips
- Keep all backend API calls centralized in FormService for consistency and easy updates.
- Avoid direct HTTP calls in components; always use the service.
- Update this documentation whenever new integration points are added.

## Update Flow

To update an existing form:
- Click the yellow update (refresh) icon next to a form in the list.
- Select a new Excel file (XLS/XLSX) from your computer.
- The file is sent to the backend, which updates the form in place (preserving its ID and history).
- The UI will reload the form list and show the updated details.

This feature uses the backend endpoint `PUT /api/forms/:formId/update` and the `updateForm` method in FormService.

## Parse Only Flow

To preview a form schema without saving:
- Select Excel files using drag-and-drop or file browser.
- Click the "Parse Only" button to parse files without saving to database.
- View parsed results with structured information display.
- Use "View Schema" button to open detailed modal with interactive schema viewer.
- Download JSON schema or copy to clipboard from the modal.

This feature uses the backend endpoint `POST /api/forms/parse` and the `parseFile` method in FormService.

