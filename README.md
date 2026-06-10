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

*Last measured: 2026-06-10 20:21 UTC against the live Render deployment.*

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 1705–3841ms (1.705–3.841s) |
| **Form Parsing** | 4785–5927ms (4.785–5.927s) |
| **Form Upload** | 7750–7750ms (7.750–7.750s) |
| **Question Processing** | 18.720ms per item |
| **Option Processing** | 10.794ms per item |
| **Batch Processing** | 7750–7750ms (7.750–7.750s) |
| **Delete Operations** | 906–906ms (0.905–0.905s) |
| **Cold Start Time** | 304ms |

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
