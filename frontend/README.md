# Frontend

Angular 19 SPA with SSR, Angular Material dark theme, and async bulk-upload queue. Deployed on Vercel.

---

## Local Setup

```bash
cd frontend/
npm install
ng serve --port 4200
```

App: http://localhost:4200 (expects backend at http://localhost:8000)

### Runtime Config

API URL is loaded at startup from `public/assets/config.json` so no rebuild is needed to point at a different backend:

```json
{ "API_URL": "https://your-backend.onrender.com/api" }
```

Falls back to `http://localhost:8000/api` if the file is missing.

---

## Structure

```
src/app/
  components/
    upload/      # Main drag-drop upload + form list + queue management
    navbar/      # Top navigation
    search/      # Form search bar
  services/
    form.service.ts          # All API calls
    form-preview.service.ts  # Preview state
  models/
    form.model.ts
  runtime-config.ts          # Async config loader (reads config.json)
```

### Key Features

- **Async upload queue** — concurrent file processing with pause / resume / stop
- **Validation feedback** — per-file error and warning lists from the backend
- **Form management** — view, update, delete stored forms
- **SSR** — Angular Universal with client hydration and event replay
- **Dark theme** — Angular Material with custom SCSS variables

---

## Testing

```bash
npm run test:run     # Vitest (jsdom)
```

Test files live in `tests/frontend/`.

---

## Building for Production

```bash
npm run build
# output: dist/mform-upload/
```

Vercel picks this up automatically on push to `main`.
