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

