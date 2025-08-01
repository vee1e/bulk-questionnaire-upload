from fastapi import FastAPI, UploadFile, HTTPException, File, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from services.xlsform_parser import XLSFormParser
from services.database_service import DatabaseService
from models.form import FormValidation, ParsedForm
from database import connect_to_mongo, close_mongo_connection
import logging
import asyncio
from typing import List
import time
import os
from fastapi.responses import JSONResponse
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="mForm Bulk Upload API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_service = DatabaseService()

METRICS_FILE = os.path.join(os.path.dirname(__file__), 'metrics.txt')

def log_metric(metric_name, value):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    with open(METRICS_FILE, 'a') as f:
        f.write(f"[{timestamp}] {metric_name}: {value}\n")

startup_time = None

@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup and log cold start time"""
    global startup_time
    startup_time = time.time()
    await connect_to_mongo()
    log_metric('cold_startup_time', time.strftime('%Y-%m-%d %H:%M:%S'))

@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown"""
    await close_mongo_connection()

@app.post("/api/validate", response_model=FormValidation)
async def validate_file(file: UploadFile):
    """
    Validate the uploaded Excel file format
    """
    if not file.filename or not file.filename.endswith(('.xls', '.xlsx')):
        return FormValidation(
            valid=False,
            message="Invalid file format. Only .xls/.xlsx files are allowed.",
            sheets=[],
            form_metadata={},
            questions_count=0,
            options_count=0
        )

    try:
        parser = XLSFormParser()
        validation_result = await parser.validate_file(file)
        return FormValidation(**validation_result)
    except Exception as e:
        logger.error(f"Error validating file: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/forms/parse")
async def parse_file(file: UploadFile):
    """
    Parse the uploaded Excel file and return JSON schema without saving to database
    """
    # Enhanced file validation
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Missing file",
                "message": "No file was uploaded. Please select an Excel file (.xls or .xlsx) to parse.",
                "error_type": "MISSING_FILE",
                "suggestions": [
                    "Make sure to select a file before submitting",
                    "Check that the file input field is not empty"
                ]
            }
        )
    
    if not file.filename.endswith(('.xls', '.xlsx')):
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'unknown'
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid file format",
                "message": f"File '{file.filename}' has extension '.{file_extension}' but only Excel files (.xls, .xlsx) are supported.",
                "error_type": "INVALID_FILE_FORMAT",
                "received_format": file_extension,
                "supported_formats": ["xls", "xlsx"],
                "suggestions": [
                    "Convert your file to Excel format (.xlsx)",
                    "Make sure the file is a valid Excel workbook",
                    "Check that the file extension matches the actual file type"
                ]
            }
        )

    # Enhanced file size validation
    try:
        file_size = len(await file.read())
        await file.seek(0)  # Reset file pointer
        
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Empty file",
                    "message": f"The uploaded file '{file.filename}' is empty (0 bytes).",
                    "error_type": "EMPTY_FILE",
                    "file_size": file_size,
                    "suggestions": [
                        "Make sure the file contains data",
                        "Check that the file was uploaded completely",
                        "Verify the file is not corrupted"
                    ]
                }
            )
        
        # Warn about large files (>10MB)
        if file_size > 10 * 1024 * 1024:
            logger.warning(f"Large file uploaded: {file.filename} ({file_size} bytes)")
            
    except Exception as e:
        logger.error(f"Error reading file size: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "File access error",
                "message": f"Unable to read the uploaded file '{file.filename}'. The file may be corrupted or inaccessible.",
                "error_type": "FILE_ACCESS_ERROR",
                "suggestions": [
                    "Try uploading the file again",
                    "Check that the file is not corrupted",
                    "Ensure the file is not password protected"
                ]
            }
        )

    try:
        parser = XLSFormParser()
        result = await parser.parse_file_only(file)
        
        # Check if validation failed
        if isinstance(result, dict) and result.get('valid') == False:
            # Return structured validation errors in the same format as validation endpoint
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Validation failed",
                    "message": result.get('message', 'File validation failed'),
                    "error_type": "VALIDATION_ERROR",
                    "file_name": result.get('file_name', file.filename),
                    "errors": result.get('errors', []),
                    "warnings": result.get('warnings', []),
                    "suggestions": [
                        "Fix the validation errors listed below",
                        "Check that all required fields are filled in",
                        "Verify data types are correct (numbers in numeric columns)",
                        "Make sure there are no duplicate values where unique values are required"
                    ]
                }
            )
        
        return result
    except HTTPException:
        # Re-raise HTTPExceptions (like validation errors) as-is
        raise
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error parsing file {file.filename}: {error_message}")
        
        # Provide more specific error details based on the exception
        error_detail = {
            "error": "Parsing failed",
            "message": f"Failed to parse Excel file '{file.filename}': {error_message}",
            "error_type": "PARSING_ERROR",
            "file_name": file.filename,
            "raw_error": error_message,
            "suggestions": [
                "Check that the Excel file has the required sheets: 'Forms', 'Questions Info', 'Answer Options'",
                "Verify that all required columns are present in each sheet",
                "Make sure the data in cells is properly formatted",
                "Check for any merged cells or unusual formatting that might cause issues"
            ]
        }
        
        # Add specific error handling for common issues
        if "No such file or directory" in error_message:
            error_detail.update({
                "error_type": "FILE_NOT_FOUND",
                "suggestions": ["The file may have been corrupted during upload", "Try uploading the file again"]
            })
        elif "Missing required sheets" in error_message:
            error_detail.update({
                "error_type": "MISSING_SHEET",
                "suggestions": [
                    "Ensure your Excel file contains sheets named: 'Forms', 'Questions Info', 'Answer Options'",
                    "Check sheet names for exact spelling and case sensitivity",
                    "Make sure sheets are not hidden"
                ]
            })
        elif "sheet missing required columns" in error_message:
            error_detail.update({
                "error_type": "MISSING_COLUMNS",
                "suggestions": [
                    "Check that all required columns are present in each sheet",
                    "Forms sheet needs: 'Language', 'Title'",
                    "Questions Info sheet needs: 'Order', 'Title', 'View Sequence', 'Input Type'",
                    "Answer Options sheet needs: 'Order', 'Id', 'Label'"
                ]
            })
        elif "sheet is empty" in error_message:
            error_detail.update({
                "error_type": "EMPTY_SHEET",
                "suggestions": [
                    "Make sure all required sheets contain data",
                    "Check that there are no empty rows at the beginning of sheets",
                    "Verify that column headers are present"
                ]
            })
        elif "No valid questions found" in error_message or "No valid options found" in error_message:
            error_detail.update({
                "error_type": "INVALID_DATA_FORMAT",
                "suggestions": [
                    "Check that all rows have data in required columns",
                    "Make sure there are no missing values in critical fields",
                    "Verify data types: Order should be integers, Input Type should be 1-10",
                    "Check that question and option data is properly formatted"
                ]
            })
        elif "Failed to read Excel file" in error_message:
            error_detail.update({
                "error_type": "CORRUPTED_FILE",
                "suggestions": [
                    "The file may be corrupted or not a valid Excel file",
                    "Try saving the file as a new Excel workbook (.xlsx)",
                    "Check that the file is not password protected",
                    "Make sure the file was uploaded completely"
                ]
            })
        elif any(keyword in error_message.lower() for keyword in ["json.parse", "unexpected character", "invalid json"]):
            error_detail.update({
                "error_type": "INVALID_RESPONSE",
                "suggestions": [
                    "There was an internal error processing your file",
                    "The file may contain unusual formatting that caused parsing issues",
                    "Try simplifying the file structure and removing any complex formatting"
                ]
            })
        elif "Failed to parse questions from" in error_message or "Failed to parse options from" in error_message:
            error_detail.update({
                "error_type": "DATA_FORMAT_ERROR",
                "suggestions": [
                    "Check that all data in the Questions Info and Answer Options sheets is properly formatted",
                    "Order and View Sequence columns should contain only integers",
                    "Input Type should be a number between 1-10",
                    "Make sure there are no text values in numeric columns",
                    "Check for any blank cells in required columns"
                ]
            })
        elif "invalid literal for int()" in error_message or "could not convert" in error_message:
            error_detail.update({
                "error_type": "INVALID_DATA_TYPE",
                "suggestions": [
                    "Check that numeric columns contain only numbers",
                    "Order, View Sequence, Input Type, and Id columns should contain integers only",
                    "Remove any text values from numeric columns",
                    "Make sure cells don't contain formulas that result in text"
                ]
            })
        elif "Failed to build form schema" in error_message or "validation error" in error_message:
            error_detail.update({
                "error_type": "SCHEMA_VALIDATION_ERROR",
                "suggestions": [
                    "Check that all question titles are properly filled in",
                    "Make sure there are no empty cells in required fields",
                    "Verify that all data is in the correct format",
                    "Check for any NaN (empty) values in the data"
                ]
            })
        elif "Failed to parse form metadata" in error_message:
            error_detail.update({
                "error_type": "INVALID_FORM_METADATA",
                "suggestions": [
                    "Check that the Forms sheet has valid data in Language and Title columns",
                    "Make sure the first row contains the actual form data",
                    "Verify that Language and Title cells are not empty"
                ]
            })
        elif "does not exist" in error_message or "KeyError" in error_message:
            error_detail.update({
                "error_type": "MISSING_SHEET",
                "suggestions": [
                    "Ensure your Excel file contains sheets named: 'Forms', 'Questions Info', 'Answer Options'",
                    "Check sheet names for exact spelling and case sensitivity",
                    "Make sure sheets are not hidden"
                ]
            })
        elif "Empty DataFrame" in error_message:
            error_detail.update({
                "error_type": "EMPTY_SHEET",
                "suggestions": [
                    "Make sure all required sheets contain data",
                    "Check that there are no empty rows at the beginning of sheets",
                    "Verify that column headers are present"
                ]
            })
        elif any(keyword in error_message for keyword in ["list index out of range", "IndexError", "ValueError", "TypeError"]):
            error_detail.update({
                "error_type": "DATA_FORMAT_ERROR",
                "suggestions": [
                    "Check that all rows have data in required columns",
                    "Make sure there are no missing values in critical fields",
                    "Verify data types match expected formats (numbers should be integers)",
                    "Check for any blank cells in required columns"
                ]
            })
        elif "Permission denied" in error_message:
            error_detail.update({
                "error_type": "PERMISSION_ERROR",
                "suggestions": [
                    "The file may be open in another application",
                    "Check file permissions",
                    "Try saving the file with a different name"
                ]
            })
        elif "cannot be determined" in error_message or "must specify an engine" in error_message:
            error_detail.update({
                "error_type": "INVALID_FILE_FORMAT",
                "suggestions": [
                    "The file appears to be corrupted or not a valid Excel file",
                    "Try opening the file in Excel and saving it as a new .xlsx file",
                    "Check that the file extension matches the actual file type"
                ]
            })
        
        raise HTTPException(status_code=400, detail=error_detail)

@app.post("/api/upload", response_model=List[ParsedForm])
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Parse and process multiple uploaded XLSForm files concurrently
    """
    parser = XLSFormParser()

    async def process_file(file: UploadFile):
        try:
            return await parser.parse_file(file)
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {str(e)}")
            
            # Check if this is a validation error with structured data
            if hasattr(e, 'validation_errors') and hasattr(e, 'validation_warnings'):
                return {
                    "error": "Validation failed",
                    "message": str(e),
                    "error_type": "VALIDATION_ERROR",
                    "filename": file.filename,
                    "errors": e.validation_errors,
                    "warnings": e.validation_warnings
                }
            else:
                return {
                    "error": str(e), 
                    "filename": file.filename,
                    "error_type": "PROCESSING_ERROR"
                }

    batch_start = time.time()
    results = await asyncio.gather(*(process_file(file) for file in files))
    batch_time = time.time() - batch_start
    log_metric('all_forms_batch_process_time', batch_time)
    total_forms = len(files)
    log_metric('total_forms', total_forms)
    if total_forms > 0:
        avg_form_time = batch_time / total_forms
        log_metric('avg_one_form_process_time', avg_form_time)
    return results

@app.get("/api/forms")
async def get_all_forms():
    """
    Get all forms from the database
    """
    try:
        forms = await db_service.get_all_forms()
        return {"forms": forms, "count": len(forms)}
    except Exception as e:
        logger.error(f"Error getting forms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forms/{form_id}")
async def get_form_by_id(form_id: str):
    """
    Get a specific form by ID
    """
    try:
        form = await db_service.get_form_by_id(form_id)
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        questions = await db_service.get_questions_by_form_id(form_id)
        options = await db_service.get_options_by_form_id(form_id)

        return {
            "form": form,
            "questions": questions,
            "options": options,
            "questions_count": len(questions),
            "options_count": len(options)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting form: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/forms/{form_id}/update")
async def update_form(form_id: str, file: UploadFile = File(...)):
    """
    Update an existing form by ID with a new XLS file
    """
    if not file.filename or not file.filename.endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .xls/.xlsx files are allowed.")

    try:
        parser = XLSFormParser()
        # Parse the file to get new metadata, questions, and options
        df_dict = pd.read_excel(file.file, sheet_name=None)
        forms_df = df_dict['Forms']
        questions_df = df_dict['Questions Info']
        options_df = df_dict['Answer Options']
        form_metadata = parser._parse_form_metadata(forms_df)
        questions_data = parser._parse_questions_data(questions_df)
        options_data = parser._parse_options_data(options_df)

        # Update the form in the database
        success = await db_service.update_form(form_id, form_metadata, questions_data, options_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update form.")

        # Return the updated form details
        form = await db_service.get_form_by_id(form_id)
        questions = await db_service.get_questions_by_form_id(form_id)
        options = await db_service.get_options_by_form_id(form_id)
        return {
            "form": form,
            "questions": questions,
            "options": options,
            "questions_count": len(questions),
            "options_count": len(options)
        }
    except Exception as e:
        logger.error(f"Error updating form: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/forms/{form_id}")
async def delete_form(form_id: str):
    """
    Delete a form and all related data
    """
    start_delete = time.time()
    try:
        form = await db_service.get_form_by_id(form_id)
        questions = await db_service.get_questions_by_form_id(form_id)
        options = await db_service.get_options_by_form_id(form_id)
        num_questions = len(questions)
        num_options = len(options)
        success = await db_service.delete_form(form_id)
        delete_time = time.time() - start_delete
        log_metric('delete_form_time', delete_time)
        log_metric('deleted_questions', num_questions)
        log_metric('deleted_options', num_options)
        if not success:
            raise HTTPException(status_code=404, detail="Form not found")
        return {"message": "Form deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting form: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/forms")
async def delete_all_forms():
    """
    Delete all forms and all related data
    """
    start_delete = time.time()
    try:
        forms = await db_service.get_all_forms()
        questions_count = 0
        options_count = 0
        for form in forms:
            questions = await db_service.get_questions_by_form_id(form['id'])
            options = await db_service.get_options_by_form_id(form['id'])
            questions_count += len(questions)
            options_count += len(options)
        total_forms = len(forms)
        success = await db_service.delete_all_forms()
        delete_time = time.time() - start_delete
        log_metric('delete_all_forms_time', delete_time)
        log_metric('deleted_forms', total_forms)
        log_metric('deleted_questions', questions_count)
        log_metric('deleted_options', options_count)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete all forms")
        return {"message": "All forms deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting all forms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
