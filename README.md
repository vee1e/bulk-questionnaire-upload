# Bulk Questionnaire Upload System

Upload, validate, and manage Excel-based questionnaires through a modern web UI. XLSForm-compatible three-sheet format (Forms / Questions Info / Answer Options), parsed into a mobile-app-ready JSON schema and stored in MongoDB.

**Live:** [bulk-questionnaire-upload.vercel.app](https://bulk-questionnaire-upload.vercel.app) · **API:** [bulk-questionnaire-upload.onrender.com](https://bulk-questionnaire-upload.onrender.com/docs)

---

## Screenshots

<!-- TODO: replace with actual screenshots -->
| Upload & Validate | Form List | Form Preview |
|:-----------------:|:---------:|:------------:|
| _screenshot_ | _screenshot_ | _screenshot_ |

---

## Performance

Benchmarks are measured automatically on every push to `main` against the live Render deployment.

<!-- PERF_TABLE_START -->

*Last measured: 2026-06-02 08:30 UTC against the live Render deployment.*

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 1314–1519ms (1.314–1.519s) |
| **Form Parsing** | 4832–5984ms (4.832–5.984s) |
| **Form Upload** | N/A (MongoDB not connected) |
| **Question Processing** | N/A (MongoDB not connected) |
| **Option Processing** | N/A (MongoDB not connected) |
| **Batch Processing** | N/A (MongoDB not connected) |
| **Delete Operations** | N/A (MongoDB not connected) |
| **Cold Start Time** | 346ms |

<!-- PERF_TABLE_END -->

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 19, Angular Material, SSR |
| Backend | FastAPI, Uvicorn, Pandas, Motor |
| Database | MongoDB Atlas |
| Deploy | Vercel (frontend) · Render (backend) |
| CI | GitHub Actions — tests + live perf benchmarks |

See [`backend/README.md`](backend/README.md) for API reference, file format specs, and local setup.  
See [`frontend/README.md`](frontend/README.md) for component structure, config, and development guide.

---

## Contributing

1. Fork and create a branch: `git checkout -b feat/your-thing`
2. Make changes and ensure tests pass: `pytest tests/backend` · `npm run test:run`
3. Commit with a conventional message: `feat:`, `fix:`, `docs:`, `test:`
4. Open a pull request — CI runs backend tests, frontend tests, and a live perf benchmark on merge

**Checklist before opening a PR:**
- [ ] Tests added or updated
- [ ] No new lint errors
- [ ] API changes reflected in `backend/README.md`
