from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from services.xlsform_parser import XLSFormParser
from services.database_service import DatabaseService
from models.form import FormValidation, ParsedForm
from database import connect_to_mongo, close_mongo_connection
import logging

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

@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup"""
    await connect_to_mongo()

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

@app.post("/api/upload", response_model=ParsedForm)
async def upload_file(file: UploadFile):
    """
    Parse and process the uploaded XLSForm file
    """
    try:
        parser = XLSFormParser()
        parsed_form = await parser.parse_file(file)
        return parsed_form
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

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

@app.delete("/api/forms/{form_id}")
async def delete_form(form_id: str):
    """
    Delete a form and all related data
    """
    try:
        success = await db_service.delete_form(form_id)
        if not success:
            raise HTTPException(status_code=404, detail="Form not found")

        return {"message": "Form deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting form: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
