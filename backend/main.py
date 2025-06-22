from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from services.xlsform_parser import XLSFormParser
from models.form import FormValidation, ParsedForm
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="mForm Bulk Upload API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/validate", response_model=FormValidation)
async def validate_file(file: UploadFile):
    """
    Validate the uploaded Excel file format
    """
    try:
        if not file.filename or not file.filename.endswith(('.xls', '.xlsx')):
            return FormValidation(
                valid=False, 
                message="Invalid file format. Only .xls/.xlsx files are allowed.",
                sheets=[],
                form_metadata={},
                questions_count=0,
                options_count=0
            )

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
