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

*Last measured: 2026-06-10 20:25 UTC against the live Render deployment.*

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 1291–2444ms (1.291–2.444s) |
| **Form Parsing** | 4798–5122ms (4.798–5.122s) |
| **Form Upload** | 7886–7886ms (7.886–7.886s) |
| **Question Processing** | 19.049ms per item |
| **Option Processing** | 10.984ms per item |
| **Batch Processing** | 7886–7886ms (7.886–7.886s) |
| **Delete Operations** | 1001–1001ms (1.001–1.001s) |
| **Cold Start Time** | 796ms |

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
