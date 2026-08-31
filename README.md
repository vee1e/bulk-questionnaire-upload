# Bulk Questionnaire Upload System

Upload, validate, and manage Excel-based questionnaires through a modern web UI. XLSForm-compatible three-sheet format (Forms / Questions Info / Answer Options), parsed into a mobile-app-ready JSON schema and stored in MongoDB.

- Live at [bulkforms.lverma.com](https://bulkforms.lverma.com/)
- API at [bulk-questionnaire-upload.onrender.com](https://bulk-questionnaire-upload.onrender.com/docs)

## Screenshots

| Upload & Validate|
|:-----------------:|
| <img width="2896" height="1802" alt="image" src="https://github.com/user-attachments/assets/631775e7-d9be-428f-8116-dac9dcc8ac81" /> |
| Form Parse with Errors |
| <img width="2896" height="1802" alt="image" src="https://github.com/user-attachments/assets/d7b59f33-5afe-43ef-b55f-93ae9bc4891a" /> |
| Form Parse Successful |
| <img width="1457" height="906" alt="image" src="https://github.com/user-attachments/assets/ae9cb552-7671-4029-9724-334f7588e1d7" />  |


## Performance

Benchmarks are measured automatically on every push to `main` against the live Render deployment.

<!-- PERF_TABLE_START -->

*Last measured: 2026-08-31 22:03 UTC against the live Render deployment.*

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 1228–3090ms (1.228–3.090s) |
| **Form Parsing** | 4511–5094ms (4.511–5.094s) |
| **Form Upload** | 6553–6553ms (6.553–6.553s) |
| **Question Processing** | 15.828ms per item |
| **Option Processing** | 9.127ms per item |
| **Batch Processing** | 6553–6553ms (6.553–6.553s) |
| **Delete Operations** | 932–932ms (0.932–0.932s) |
| **Cold Start Time** | 285ms |

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
