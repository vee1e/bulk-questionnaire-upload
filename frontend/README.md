# mForm Bulk Upload

## About the Frontend

This frontend is a modern Angular application for bulk uploading, validating, and managing questionnaire forms (in Excel format). It provides a user-friendly interface for users to drag-and-drop or browse files, validate them, upload them to the backend, and view/manage parsed forms and their details.

### Main Features
- **Bulk Upload**: Drag-and-drop or select multiple Excel files for upload.
- **Validation**: Validate all selected files before uploading to ensure correct format and content.
- **Form Management**: View a list of all uploaded forms, search by title, and delete individual or all forms.
- **Form Details**: Click on a form to view its questions, options, and metadata in a modal dialog.
- **Responsive UI**: Built with Angular Material for a clean, modern, and responsive user experience.

### Key Components
- **Navbar**: Displays the application title and navigation bar.
- **Search**: Allows searching forms by title.
- **Upload**: Handles file selection, validation, upload, and displays the list of forms and their details.

### Project Structure
- `src/app/components/navbar/` - Navigation bar component
- `src/app/components/search/` - Search bar component
- `src/app/components/upload/` - Main upload and form management component
- `src/app/services/` - Services for form parsing and backend API communication
- `src/app/models/` - TypeScript interfaces for form and question data

# Backend Integration Points

This document outlines where and how the frontend communicates with the backend API for easy maintenance and future updates.

## Main Integration Service

### `FormService` (`src/app/services/form.service.ts`)
This Angular service encapsulates all HTTP communication with the backend API. It is the single source of truth for API endpoints used by the frontend.

**Endpoints Used:**
- `POST /api/validate` — Validate a form file before upload
- `POST /api/upload` — Upload a form file (single or multiple)
- `GET /api/forms` — Fetch all uploaded forms
- `GET /api/forms/:formId` — Fetch details for a specific form
- `DELETE /api/forms/:formId` — Delete a specific form
- `DELETE /api/forms` — Delete all forms

**Service Methods:**
- `validateFile(file: File)`
- `uploadFile(file: File)`
- `uploadFiles(files: File[])`
- `getAllForms()`
- `getFormById(formId: string)`
- `deleteForm(formId: string)`
- `deleteAllForms()`

## Components Using Backend Integration

### `UploadComponent` (`src/app/components/upload/upload.component.ts`)
- Uses `FormService` to:
  - Validate files before upload
  - Upload files
  - Fetch the list of forms
  - Delete individual forms
  - Delete all forms
  - Fetch form details for preview

### `NavbarComponent` (`src/app/components/navbar/navbar.component.ts`)
- Indirectly uses backend data via `FormPreviewService`, which is populated by `UploadComponent` using `FormService`.

## How to Update Backend Endpoints
- All backend API URLs are defined in `FormService` as `apiUrl`.
- To change the backend base URL or endpoints, update `FormService` accordingly.
- If new endpoints are added to the backend, add corresponding methods to `FormService` and use them in components as needed.

## Maintenance Tips
- Keep all backend API calls centralized in `FormService` for consistency and easy updates.
- Avoid direct HTTP calls in components; always use the service.
- Update this documentation whenever new integration points are added.

