# Bulk Questionnaire Upload System

Upload, validate, and manage Excel-based questionnaires through a modern web UI. XLSForm-compatible three-sheet format (Forms / Questions Info / Answer Options), parsed into a mobile-app-ready JSON schema and stored in MongoDB.

- Live at [bulk-questionnaire-upload.vercel.app](https://bulk-questionnaire-upload.vercel.app)
- API at [bulk-questionnaire-upload.onrender.com](https://bulk-questionnaire-upload.onrender.com/docs)

## Screenshots

| Upload & Validate|
|:-----------------:|
| <img width="2896" height="1802" alt="image" src="https://github.com/user-attachments/assets/631775e7-d9be-428f-8116-dac9dcc8ac81" />|
| Form Parse with Errors |
| <img width="2896" height="1802" alt="image" src="https://github.com/user-attachments/assets/d7b59f33-5afe-43ef-b55f-93ae9bc4891a" /> |
| Form Parse Successful |
| <img width="2896" height="1802" alt="image" src="https://github.com/user-attachments/assets/a4bf74ab-0a8c-46cc-8379-5c9e769c5565" /> |


## Performance

Benchmarks are measured automatically on every push to `main` against the live Render deployment.

<!-- PERF_TABLE_START -->

*Last measured: 2026-06-10 20:28 UTC against the live Render deployment.*

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 1377–2096ms (1.377–2.096s) |
| **Form Parsing** | 5086–5706ms (5.086–5.705s) |
| **Form Upload** | 8075–8075ms (8.075–8.075s) |
| **Question Processing** | 19.506ms per item |
| **Option Processing** | 11.247ms per item |
| **Batch Processing** | 8075–8075ms (8.075–8.075s) |
| **Delete Operations** | 911–911ms (0.911–0.911s) |
| **Cold Start Time** | 371ms |

<!-- PERF_TABLE_END -->

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 19, Angular Material, SSR |
| Backend | FastAPI, Uvicorn, Pandas, Motor |
| Database | MongoDB Atlas |
| Deploy | Vercel (frontend) · Render (backend) |
| CI | GitHub Actions - tests + live perf benchmarks |

See [`backend/README.md`](backend/README.md) for API reference, file format specs, and local setup.
See [`frontend/README.md`](frontend/README.md) for component structure, config, and development guide.
