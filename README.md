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

*Last measured: 2026-06-09 18:18 UTC against the live Render deployment.*

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 1285–1996ms (1.285–1.996s) |
| **Form Parsing** | 5214–5682ms (5.214–5.681s) |
| **Form Upload** | 75274–75274ms (75.274–75.274s) |
| **Question Processing** | 181.821ms per item |
| **Option Processing** | 104.839ms per item |
| **Batch Processing** | 75274–75274ms (75.274–75.274s) |
| **Delete Operations** | 958–958ms (0.958–0.958s) |
| **Cold Start Time** | 386ms |

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
