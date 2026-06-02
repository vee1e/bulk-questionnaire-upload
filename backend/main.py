from fastapi import FastAPI, UploadFile, HTTPException, File, Request
from starlette.datastructures import UploadFile as StarletteUploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from services.xlsform_parser import XLSFormParser
from services.database_service import DatabaseService
from models.form import FormValidation, ParsedForm
from database import connect_to_mongo, close_mongo_connection
import logging
import asyncio
from typing import List, Optional
import time
import os
from fastapi.responses import JSONResponse
import pandas as pd
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB hard limit

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="mForm Bulk Upload API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS
# Strip trailing slashes so the browser-sent origin (no slash) matches exactly.
# FRONTEND_URL may be a comma-separated list for multi-origin deployments.
# ---------------------------------------------------------------------------
_raw_frontend = os.getenv("FRONTEND_URL", "http://localhost:4200")
_allowed_origins = [o.strip().rstrip("/") for o in _raw_frontend.split(",") if o.strip()]
# Always permit localhost so local development works without environment setup
for _dev in ["http://localhost:4200", "http://localhost:8000"]:
    if _dev not in _allowed_origins:
        _allowed_origins.append(_dev)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=600,
)

# ---------------------------------------------------------------------------
# File-size guard — reads at most MAX_FILE_SIZE+1 bytes so huge files are
# rejected before the parser ever touches them.
# ---------------------------------------------------------------------------
async def _check_file_size(upload: UploadFile, filename: str) -> int:
    chunk = await upload.read(MAX_FILE_SIZE + 1)
    await upload.seek(0)
    if len(chunk) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Empty file",
                "message": f"The uploaded file '{filename}' is empty (0 bytes).",
                "error_type": "EMPTY_FILE",
                "suggestions": ["Make sure the file contains data", "Check that the file was uploaded completely"],
            },
        )
    if len(chunk) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "File too large",
                "message": f"File exceeds the {MAX_FILE_SIZE // (1024 * 1024)} MB limit.",
                "error_type": "FILE_TOO_LARGE",
            },
        )
    return len(chunk)


# ---------------------------------------------------------------------------
# Map internal exception messages to user-friendly error details without
# leaking stack traces, file paths, or connection strings.
# ---------------------------------------------------------------------------
def _parse_error_detail(error_message: str, filename: str) -> dict:
    base: dict = {
        "error": "Parsing failed",
        "message": f"Failed to parse Excel file '{filename}'.",
        "error_type": "PARSING_ERROR",
        "file_name": filename,
        "suggestions": [
            "Check that the Excel file has the required sheets: 'Forms', 'Questions Info', 'Answer Options'",
            "Verify that all required columns are present in each sheet",
            "Make sure data is properly formatted (numbers in numeric columns)",
        ],
    }
    if "Missing required sheets" in error_message or "does not exist" in error_message or "KeyError" in error_message:
        base.update({"error_type": "MISSING_SHEET", "message": f"A required sheet is missing in '{filename}'."})
    elif "sheet missing required columns" in error_message:
        base.update({"error_type": "MISSING_COLUMNS", "message": f"A required column is missing in '{filename}'."})
    elif "sheet is empty" in error_message or "Empty DataFrame" in error_message:
        base.update({"error_type": "EMPTY_SHEET", "message": f"A required sheet is empty in '{filename}'."})
    elif "No valid questions found" in error_message or "No valid options found" in error_message:
        base.update({"error_type": "INVALID_DATA_FORMAT", "message": "No valid questions or options were found."})
    elif "Failed to read Excel file" in error_message or "Excel file format cannot be determined" in error_message:
        base.update({"error_type": "CORRUPTED_FILE", "message": f"Unable to read '{filename}'. The file may be corrupted or not a valid Excel file."})
    elif "invalid literal for int()" in error_message or "could not convert" in error_message:
        base.update({"error_type": "INVALID_DATA_TYPE", "message": "A column contains a value of the wrong type (e.g. text where a number is expected)."})
    elif "Failed to build form schema" in error_message or "validation error" in error_message.lower():
        base.update({"error_type": "SCHEMA_VALIDATION_ERROR", "message": "Form schema validation failed. Check that all required fields are filled in."})
    elif "Failed to parse form metadata" in error_message:
        base.update({"error_type": "INVALID_FORM_METADATA", "message": "The Forms sheet contains invalid metadata."})
    elif any(k in error_message for k in ["list index out of range", "IndexError", "ValueError", "TypeError"]):
        base.update({"error_type": "DATA_FORMAT_ERROR", "message": "Data format error in the Excel file."})
    elif "Permission denied" in error_message:
        base.update({"error_type": "PERMISSION_ERROR", "message": "The file could not be read."})
    elif "cannot be determined" in error_message or "must specify an engine" in error_message:
        base.update({"error_type": "INVALID_FILE_FORMAT", "message": f"'{filename}' does not appear to be a valid Excel file."})
    return base


# ---------------------------------------------------------------------------
db_service = DatabaseService()

METRICS_FILE = os.path.join(os.path.dirname(__file__), "metrics.txt")


def log_metric(metric_name: str, value) -> None:
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(METRICS_FILE, "a") as f:
        f.write(f"[{timestamp}] {metric_name}: {value}\n")


startup_time: Optional[float] = None


@app.on_event("startup")
async def startup_event() -> None:
    global startup_time
    startup_time = time.time()
    asyncio.create_task(_connect_with_log())


async def _connect_with_log() -> None:
    try:
        await connect_to_mongo()
        log_metric("cold_startup_time", time.strftime("%Y-%m-%d %H:%M:%S"))
    except Exception:
        logger.error("MongoDB connection failed at startup")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await close_mongo_connection()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/validate", response_model=FormValidation)
@limiter.limit("60/minute")
async def validate_file(request: Request, file: UploadFile = File(...)):
    """Validate the uploaded Excel file format."""
    if not file.filename or not file.filename.endswith((".xls", ".xlsx")):
        return FormValidation(
            valid=False,
            message="Invalid file format. Only .xls/.xlsx files are allowed.",
            sheets=[],
            form_metadata={},
            questions_count=0,
            options_count=0,
        )
    await _check_file_size(file, file.filename)
    try:
        parser = XLSFormParser()
        validation_result = await parser.validate_file(file)
        return FormValidation(**validation_result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating file: {e}")
        raise HTTPException(status_code=400, detail="File validation failed. Check the file format and try again.")


@app.post("/api/forms/parse")
@limiter.limit("60/minute")
async def parse_file(request: Request):
    """Parse the uploaded Excel file and return tempData.json format without saving to database."""
    form = await request.form()
    file_field = form.get("file")
    filename: Optional[str] = None
    upload: Optional[UploadFile] = None

    if isinstance(file_field, (UploadFile, StarletteUploadFile)):
        upload = file_field
        filename = file_field.filename
    elif isinstance(file_field, str):
        filename = file_field

    if not filename:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Missing file",
                "message": "No file was uploaded. Please select an Excel file (.xls or .xlsx) to parse.",
                "error_type": "MISSING_FILE",
                "suggestions": ["Make sure to select a file before submitting"],
            },
        )

    if not filename.endswith((".xls", ".xlsx")):
        ext = filename.rsplit(".", 1)[-1] if "." in filename else "unknown"
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid file format",
                "message": f"Only Excel files (.xls, .xlsx) are supported. Received: '.{ext}'",
                "error_type": "INVALID_FILE_FORMAT",
                "received_format": ext,
                "supported_formats": ["xls", "xlsx"],
            },
        )

    if not upload:
        raise HTTPException(
            status_code=400,
            detail={"error": "Missing file", "message": "No file content was uploaded.", "error_type": "MISSING_FILE"},
        )

    await _check_file_size(upload, filename)

    try:
        parser = XLSFormParser()
        result = await parser.parse_file_only(upload)

        if isinstance(result, dict) and result.get("valid") is False:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Validation failed",
                    "message": result.get("message", "File validation failed"),
                    "error_type": "VALIDATION_ERROR",
                    "file_name": result.get("file_name", filename),
                    "errors": result.get("errors", []),
                    "warnings": result.get("warnings", []),
                    "suggestions": ["Fix the validation errors listed below", "Check that all required fields are filled in"],
                },
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error parsing file {filename}: {error_message}")
        raise HTTPException(status_code=400, detail=_parse_error_detail(error_message, filename))


@app.post("/api/upload", response_model=List[ParsedForm])
@limiter.limit("30/minute")
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    """Parse and save multiple uploaded XLSForm files concurrently."""
    parser = XLSFormParser()

    async def process_file(file: UploadFile):
        try:
            await _check_file_size(file, file.filename or "")
            return await parser.parse_file(file)
        except HTTPException as exc:
            return {"error": exc.detail, "filename": file.filename, "error_type": "FILE_ERROR"}
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {e}")
            if hasattr(e, "validation_errors") and hasattr(e, "validation_warnings"):
                return {
                    "error": "Validation failed",
                    "message": "File failed validation.",
                    "error_type": "VALIDATION_ERROR",
                    "filename": file.filename,
                    "errors": e.validation_errors,
                    "warnings": e.validation_warnings,
                }
            return {"error": "Processing failed", "filename": file.filename, "error_type": "PROCESSING_ERROR"}

    batch_start = time.time()
    results = await asyncio.gather(*(process_file(f) for f in files))
    batch_time = time.time() - batch_start
    log_metric("all_forms_batch_process_time", batch_time)
    log_metric("total_forms", len(files))
    if files:
        log_metric("avg_one_form_process_time", batch_time / len(files))
    return results


@app.get("/api/forms")
@limiter.limit("120/minute")
async def get_all_forms(request: Request):
    """Get all forms from the database."""
    try:
        forms = await db_service.get_all_forms()
        return {"forms": forms, "count": len(forms)}
    except Exception as e:
        logger.error(f"Error getting forms: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve forms.")


@app.get("/api/forms/{form_id}")
@limiter.limit("120/minute")
async def get_form_by_id(request: Request, form_id: str):
    """Get a specific form by ID in tempData.json format."""
    try:
        form = await db_service.get_form_by_id(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")
        questions = await db_service.get_questions_by_form_id(form_id)
        options = await db_service.get_options_by_form_id(form_id)
        parser = XLSFormParser()
        return parser._convert_db_to_temp_data_format(form, questions, options)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting form {form_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve form.")


@app.put("/api/forms/{form_id}/update")
@limiter.limit("30/minute")
async def update_form(request: Request, form_id: str, file: UploadFile = File(...)):
    """Update an existing form by ID with a new XLS file."""
    if not file.filename or not file.filename.endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .xls/.xlsx files are allowed.")
    await _check_file_size(file, file.filename)
    try:
        parser = XLSFormParser()
        df_dict = pd.read_excel(file.file, sheet_name=None)
        form_metadata = parser._parse_form_metadata(df_dict["Forms"])
        questions_data = parser._parse_questions_data(df_dict["Questions Info"])
        options_data = parser._parse_options_data(df_dict["Answer Options"])

        success = await db_service.update_form(form_id, form_metadata, questions_data, options_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update form.")

        form = await db_service.get_form_by_id(form_id)
        questions = await db_service.get_questions_by_form_id(form_id)
        options = await db_service.get_options_by_form_id(form_id)
        return {"form": form, "questions": questions, "options": options, "questions_count": len(questions), "options_count": len(options)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating form {form_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update form.")


@app.delete("/api/forms/{form_id}")
@limiter.limit("30/minute")
async def delete_form(request: Request, form_id: str):
    """Delete a form and all related data."""
    start = time.time()
    try:
        questions = await db_service.get_questions_by_form_id(form_id)
        options = await db_service.get_options_by_form_id(form_id)
        success = await db_service.delete_form(form_id)
        log_metric("delete_form_time", time.time() - start)
        log_metric("deleted_questions", len(questions))
        log_metric("deleted_options", len(options))
        if not success:
            raise HTTPException(status_code=404, detail="Form not found")
        return {"message": "Form deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting form {form_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete form.")


@app.delete("/api/forms")
@limiter.limit("10/minute")
async def delete_all_forms(request: Request):
    """Delete all forms and all related data."""
    start = time.time()
    try:
        forms = await db_service.get_all_forms()
        questions_count = 0
        options_count = 0
        for form in forms:
            questions_count += len(await db_service.get_questions_by_form_id(form["id"]))
            options_count += len(await db_service.get_options_by_form_id(form["id"]))
        success = await db_service.delete_all_forms()
        log_metric("delete_all_forms_time", time.time() - start)
        log_metric("deleted_forms", len(forms))
        log_metric("deleted_questions", questions_count)
        log_metric("deleted_options", options_count)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete all forms.")
        return {"message": "All forms deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting all forms: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete all forms.")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
