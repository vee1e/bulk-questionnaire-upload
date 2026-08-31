# Bulk Questionnaire Upload System

Upload, validate, and manage Excel-based questionnaires through a modern web UI. XLSForm-compatible three-sheet format (Forms / Questions Info / Answer Options), parsed into a mobile-app-ready JSON schema and stored in MongoDB.

- Live at [bulkforms.lverma.com](https://bulkforms.lverma.com/)
- API at [bulk-api.lverma.com](https://bulk-api.lverma.com/docs)

## Screenshots

| Upload & Validate|
|:-----------------:|
| <img width="2896" height="1802" alt="image" src="https://github.com/user-attachments/assets/631775e7-d9be-428f-8116-dac9dcc8ac81" /> |
| Form Parse with Errors |
| <img width="2896" height="1802" alt="image" src="https://github.com/user-attachments/assets/d7b59f33-5afe-43ef-b55f-93ae9bc4891a" /> |
| Form Parse Successful |
| <img width="1457" height="906" alt="image" src="https://github.com/user-attachments/assets/ae9cb552-7671-4029-9724-334f7588e1d7" />  |


## Performance

Benchmarks are measured automatically on every push to `main` against the live VPS deployment.

<!-- PERF_TABLE_START -->

*Last measured: 2026-08-31 22:12 UTC against the live Render deployment.*

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 2142–3228ms (2.142–3.228s) |
| **Form Parsing** | 6833–8813ms (6.833–8.813s) |
| **Form Upload** | 9718–9718ms (9.718–9.718s) |
| **Question Processing** | 23.473ms per item |
| **Option Processing** | 13.535ms per item |
| **Batch Processing** | 9718–9718ms (9.718–9.718s) |
| **Delete Operations** | 1089–1089ms (1.089–1.089s) |
| **Cold Start Time** | 830ms |

<!-- PERF_TABLE_END -->

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 19, Angular Material, SSR |
| Backend | FastAPI, Uvicorn, Pandas, Motor |
| Database | MongoDB Atlas |
| Deploy | Vercel (frontend) · VPS (backend) |
| CI | GitHub Actions - tests + live perf benchmarks |

See [`backend/README.md`](backend/README.md) for API reference, file format specs, and local setup.
See [`frontend/README.md`](frontend/README.md) for component structure, config, and development guide.
