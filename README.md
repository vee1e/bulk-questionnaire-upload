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

| Metric Type | Recent Performance |
|-------------|-------------------|
| **File Validation** | 45–80ms (0.045–0.080s) |
| **Form Parsing** | 142–190ms (0.142–0.190s) |
| **Form Upload** | 270–680ms (0.270–0.680s) |
| **Question Processing** | 0.155–0.443ms per item |
| **Option Processing** | 0.128–0.352ms per item |
| **Batch Processing** | 270–680ms per form |
| **Delete Operations** | 12–44ms (0.012–0.044s) |
| **Cold Start Time** | ~500ms (Render free tier) |

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
