# mForm Bulk Upload Frontend

A modern, full-stack Angular application for bulk uploading, validating, parsing, and managing questionnaire forms. Built with Angular 19, featuring server-side rendering, comprehensive error handling, and a sleek dark theme interface.

## Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 19+
- Backend API server running

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Start SSR server
npm run serve:ssr:mform-upload
```

### Development Commands

```bash
npm start          # Development server on http://localhost:4200
npm run build      # Production build
npm run watch      # Watch mode build
npm run test       # Run tests with Vitest
npm run test:run   # Run tests once
```

## Architecture & Tech Stack

### Core Technologies
- **Angular 19** - Latest Angular with standalone components
- **TypeScript 5.7** - Full type safety and modern features
- **Angular Material** - UI component library with custom dark theme
- **Server-Side Rendering** - SEO-friendly and fast initial loads
- **Vitest** - Modern testing framework (replaces Jasmine/Karma)
- **Express.js** - SSR server backend

### Key Features

#### Bulk File Operations
- **Drag & Drop Interface** - Intuitive file selection with visual feedback
- **Multi-file Upload** - Process multiple Excel files simultaneously
- **Progress Tracking** - Real-time progress bars with color-coded operations
- **Batch Validation** - Validate all files before upload with detailed error reports

#### Form Management
- **Excel Parsing** - Convert XLS/XLSX files to structured JSON schemas
- **Form Preview** - Interactive form details with question/option navigation
- **Search & Filter** - Real-time search across all uploaded forms
- **Form Updates** - In-place form updates preserving history and IDs

#### User Experience
- **Dark Theme** - Custom black/white Material Design theme
- **Keyboard Shortcuts** - Power user features for efficient navigation
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Accessibility** - ARIA support and keyboard navigation

#### Performance & Reliability
- **Server-Side Rendering** - Fast initial page loads and SEO benefits
- **Error Recovery** - Comprehensive error handling with user-friendly messages
- **Offline Support** - Graceful degradation and connection status
- **Memory Management** - Efficient file handling and cleanup

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── navbar/           # Navigation with form preview
│   │   │   ├── search/           # Search functionality
│   │   │   └── upload/           # Core upload/management logic
│   │   ├── models/               # TypeScript interfaces
│   │   ├── services/             # API and state management
│   │   ├── app.component.ts      # Root component
│   │   ├── app.config.ts         # Application configuration
│   │   ├── app.routes.ts         # Routing (currently single-page)
│   │   └── main.ts               # Bootstrap
│   ├── server.ts                 # SSR server configuration
│   ├── main.server.ts            # SSR bootstrap
│   └── styles.scss               # Global dark theme styles
├── public/                       # Static assets
├── angular.json                  # Angular CLI configuration
├── vitest.config.ts              # Testing configuration
└── package.json                  # Dependencies and scripts
```

## Core Components

### UploadComponent
**Location:** `src/app/components/upload/upload.component.ts`

The main component handling all file operations and form management:

```typescript
// Key features implemented:
- Drag & drop file handling
- Multi-file validation and parsing
- Real-time progress tracking
- Form list management
- Schema preview modal
- Error handling and user feedback
```

**Key Methods:**
- `onDragOver/onDrop` - File drag & drop handling
- `validateFiles()` - Batch file validation
- `uploadFiles()` - Multi-file upload with progress
- `parseFilesOnly()` - Preview parsing without saving
- `showFormDetails()` - Form preview integration

### NavbarComponent
**Location:** `src/app/components/navbar/navbar.component.ts`

Navigation with integrated form preview system:

```typescript
// Features:
- Form preview panel with slide animation
- Keyboard navigation (Ctrl+J/K, Shift+Ctrl+J/K)
- Question-by-question navigation
- Real-time form data display
```

### SearchComponent
**Location:** `src/app/components/search/search.component.ts`

Intelligent search functionality:

```typescript
// Capabilities:
- Real-time form title search
- Keyboard shortcut (Shift+K) focus
- Debounced search for performance
- Visual feedback and accessibility
```

## API Integration

### FormService
**Location:** `src/app/services/form.service.ts`

Centralized API communication layer:

```typescript
@Injectable({ providedIn: 'root' })
export class FormService {
  private readonly apiUrl = 'http://localhost:8000/api';

  // Core API methods
  validateFile(file: File): Observable<FormValidation>
  parseFile(file: File): Observable<ParsedSchema>
  uploadFiles(files: File[]): Observable<any[]>
  getAllForms(): Observable<FormsResponse>
  getFormById(formId: string): Observable<FormDetails>
  updateForm(formId: string, file: File): Observable<FormDetails>
  deleteForm(formId: string): Observable<{ message: string }>
  deleteAllForms(): Observable<{ message: string }>
}
```

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/validate` | Validate Excel file format and content |
| POST | `/api/forms/parse` | Parse Excel to JSON schema (no save) |
| POST | `/api/upload` | Upload and save form to database |
| GET | `/api/forms` | Retrieve all uploaded forms |
| GET | `/api/forms/:id` | Get specific form details |
| PUT | `/api/forms/:id/update` | Update existing form with new file |
| DELETE | `/api/forms/:id` | Delete specific form |
| DELETE | `/api/forms` | Delete all forms |

## Styling & Theming

### Dark Theme Implementation
**Location:** `src/styles.scss`

Custom Material Design dark theme with:
- Black background with glassmorphism effects
- White text and borders for high contrast
- Custom color palette for buttons and states
- Responsive design with mobile-first approach

### Component Styling Strategy
- **Inline styles** in component decorators for encapsulation
- **Global overrides** in `styles.scss` for consistency
- **CSS custom properties** for theme flexibility
- **SCSS nesting** for maintainable component styles

## Testing Strategy

### Vitest Configuration
**Location:** `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/frontend/**/*.spec.ts'],
    globals: true
  }
})
```

### Test Structure
**Location:** `tests/frontend/`

- **form.service.spec.ts** - API service testing
- Unit tests for components and services
- Integration tests for critical user flows
- E2E test coverage for upload workflows

### Running Tests
```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

## Deployment & Production

### Build Configuration
**Location:** `angular.json`

Key production settings:
- **SSR enabled** for better performance
- **Budget limits** for bundle size optimization
- **Asset optimization** and hashing
- **Source maps** for debugging

### Production Build
```bash
npm run build
# Output: dist/mform-upload/
```

### SSR Deployment
```bash
npm run serve:ssr:mform-upload
# Starts Express server on port 4000
```

## Configuration & Environment

### Angular Configuration
**Location:** `src/app/app.config.ts`

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

### Server-Side Rendering
**Location:** `src/server.ts`

Express server with:
- Static file serving with caching
- Angular SSR integration
- Production-ready error handling

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Shift + K` | Focus search | Global |
| `Ctrl + J` | Next form | Form list |
| `Ctrl + K` | Previous form | Form list |
| `Ctrl + Shift + J` | Next question | Form preview |
| `Ctrl + Shift + K` | Previous question | Form preview |
| `Esc` | Close modals/preview | Modal open |

## Error Handling

### Validation Error Types
- **File Structure Errors** - Missing sheets, columns, invalid formats
- **Data Validation Errors** - Type mismatches, missing values, duplicates
- **Network Errors** - Connection issues, server errors, timeouts
- **File Processing Errors** - Corrupted files, encoding issues

### Error Recovery
- **User-friendly messages** with actionable suggestions
- **Automatic retry** for network failures
- **Graceful degradation** for non-critical features
- **Detailed error logs** for debugging

## Future Enhancements

### Potential Improvements
1. **File Type Support** - Add CSV, JSON import capabilities
2. **Real-time Collaboration** - Multi-user form editing
3. **Advanced Analytics** - Form usage statistics and insights
4. **Template System** - Pre-built form templates
5. **Export Options** - Additional export formats (PDF, XML)
6. **Offline Mode** - Full offline capability with sync
7. **Internationalization** - Multi-language support
8. **Performance Monitoring** - Application performance tracking

### Scalability Considerations
- **Lazy Loading** - Implement route-based code splitting
- **Service Workers** - Add PWA capabilities
- **Caching Strategy** - Implement intelligent data caching
- **Bundle Optimization** - Code splitting and tree shaking
- **CDN Integration** - Static asset optimization

## API Documentation

### Form Validation Response
```typescript
interface FormValidation {
  valid: boolean;
  message: string;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  sheets?: SheetValidation[];
  form_metadata?: Record<string, any>;
}
```

### Form Data Structure
```typescript
interface FormData {
  id: string;
  title: string;
  language: string;
  version: string;
  created_at: string;
}
```

### Parsed Schema Structure
```typescript
interface ParsedSchema {
  id: string | null;
  title: { default: string };
  version: string;
  language: string;
  groups: any[];
  metadata: {
    questions_count: number;
    options_count: number;
    parse_time: number;
  };
}
```

## Contributing

### Development Guidelines
1. **Code Style** - Follow Angular style guide and TypeScript best practices
2. **Component Design** - Use standalone components with proper encapsulation
3. **State Management** - Centralize state in services, avoid component coupling
4. **Testing** - Write tests for new features and bug fixes
5. **Documentation** - Update README and add JSDoc comments

### Code Quality
- **ESLint** integration with Angular CLI
- **Pre-commit hooks** for code quality checks
- **Type checking** with strict TypeScript configuration
- **Bundle analysis** for performance monitoring

## License

This project is licensed under the terms specified in the root LICENSE file.

Note: This documentation is automatically generated and reflects the current state of the codebase. For the most up-to-date information, refer to the source code and tests.
