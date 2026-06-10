"""
XLSFormParser – slim facade.

All heavy logic has been extracted into three focused modules:
  • XLSFormValidator      (services/xlsform_validator.py)
  • XLSFormDataParser     (services/xlsform_data_parser.py)
  • XLSFormTemplateBuilder(services/xlsform_template_builder.py)

This class composes them and keeps backward-compatible class-level constants
so that main.py and any existing tests continue to work without changes.
"""

import pandas as pd
from fastapi import UploadFile
from typing import Dict, List, Any
from models.form import ParsedForm
from services.database_service import DatabaseService
from services.xlsform_validator import XLSFormValidator
from services.xlsform_data_parser import XLSFormDataParser
from services.xlsform_template_builder import XLSFormTemplateBuilder
import logging
import time
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from utils import log_metric

logger = logging.getLogger(__name__)


class XLSFormParser:
    """Facade that composes XLSFormValidator, XLSFormDataParser, and XLSFormTemplateBuilder."""

    # ---------------------------------------------------------------------------
    # Class-level constants – kept for backward compatibility with main.py / tests
    # ---------------------------------------------------------------------------
    REQUIRED_SHEETS = XLSFormValidator.REQUIRED_SHEETS
    REQUIRED_FORMS_COLUMNS = XLSFormValidator.REQUIRED_FORMS_COLUMNS
    OPTIONAL_FORMS_COLUMNS = XLSFormValidator.OPTIONAL_FORMS_COLUMNS
    REQUIRED_QUESTIONS_COLUMNS = XLSFormValidator.REQUIRED_QUESTIONS_COLUMNS
    REQUIRED_OPTIONS_COLUMNS = XLSFormValidator.REQUIRED_OPTIONS_COLUMNS
    SUPPORTED_QUESTION_TYPES = XLSFormValidator.SUPPORTED_QUESTION_TYPES
    VALID_LANGUAGES = XLSFormValidator.VALID_LANGUAGES

    def __init__(self):
        self.db_service = DatabaseService()
        self._validator = XLSFormValidator()
        self._data_parser = XLSFormDataParser()
        self._template_builder = XLSFormTemplateBuilder()

    # ---------------------------------------------------------------------------
    # Delegating shims – used directly by main.py
    # ---------------------------------------------------------------------------

    def _convert_db_to_temp_data_format(self, form, questions, options):
        return self._template_builder._convert_db_to_temp_data_format(form, questions, options)

    def _parse_form_metadata(self, df):
        return self._data_parser._parse_form_metadata(df)

    def _parse_questions_data(self, df):
        return self._data_parser._parse_questions_data(df)

    def _parse_options_data(self, df):
        return self._data_parser._parse_options_data(df)

    # ---------------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------------

    async def validate_file(self, file: UploadFile) -> Dict[str, Any]:
        """Validate an uploaded XLS/XLSX file and return a structured report."""
        return await self._validator.validate_file(file)

    async def parse_file(self, file: UploadFile) -> ParsedForm:
        """Parse, validate, and persist an XLSForm file. Returns a ParsedForm."""
        start_all = time.time()
        try:
            df_dict = pd.read_excel(file.file, sheet_name=None)

            forms_df = df_dict["Forms"]
            questions_df = df_dict["Questions Info"]
            options_df = df_dict["Answer Options"]

            all_errors: List[Dict] = []
            all_warnings: List[Dict] = []

            fe, fw, _ = self._validator._validate_forms_content(forms_df)
            all_errors.extend(fe)
            all_warnings.extend(fw)

            qe, qw = self._validator._validate_questions_content(questions_df)
            all_errors.extend(qe)
            all_warnings.extend(qw)

            oe, ow = self._validator._validate_options_content(options_df)
            all_errors.extend(oe)
            all_warnings.extend(ow)

            cross_errors = self._validator._validate_cross_references(questions_df, options_df)
            all_errors.extend(cross_errors)

            if all_errors:
                error_messages = []
                for err in all_errors:
                    loc = err["location"]
                    if err.get("row"):
                        loc += f" (row {err['row']})"
                    if err.get("column"):
                        loc += f" (column {err['column']})"
                    error_messages.append(f"{err['message']} - {loc}")
                exc = Exception(
                    f"Validation failed with {len(all_errors)} error(s): "
                    + "; ".join(error_messages)
                )
                exc.validation_errors = all_errors  # type: ignore[attr-defined]
                exc.validation_warnings = all_warnings  # type: ignore[attr-defined]
                raise exc

            # ---- Persist form -----------------------------------------------
            start_form = time.time()
            parsed_metadata = self._data_parser._parse_form_metadata(forms_df)
            form_id = await self.db_service.save_form(parsed_metadata)
            form_time = time.time() - start_form
            log_metric("form_process_time", form_time)

            try:
                # ---- Persist questions ---------------------------------------
                start_q = time.time()
                questions_data = self._data_parser._parse_questions_data(questions_df)
                question_ids = await self.db_service.save_questions(questions_data, form_id)
                questions_time = time.time() - start_q
                log_metric("questions_process_time", questions_time)
                if questions_data:
                    log_metric("avg_one_question_process_time", questions_time / len(questions_data))

                # ---- Persist options -----------------------------------------
                start_o = time.time()
                options_data = self._data_parser._parse_options_data(options_df)
                option_ids = await self.db_service.save_options(options_data, form_id)
                options_time = time.time() - start_o
                log_metric("options_process_time", options_time)
                if options_data:
                    log_metric("avg_one_option_process_time", options_time / len(options_data))

            except Exception:
                try:
                    await self.db_service.delete_form(form_id)
                except Exception:
                    pass
                raise

            form_title = self._data_parser._get_form_title(forms_df)
            form_version = parsed_metadata.get("version", "1.0.0")
            groups = self._data_parser._parse_questions(questions_df, options_df)

            total_time = time.time() - start_all
            log_metric("total_form_upload_time", total_time)

            return ParsedForm(
                id=form_id,
                title=form_title,
                version=form_version,
                groups=groups,
                settings=None,
                metadata={
                    "questions_count": len(questions_data),
                    "options_count": len(options_data),
                    "saved_question_ids": question_ids,
                    "saved_option_ids": option_ids,
                    "form_process_time": form_time,
                    "questions_process_time": questions_time,
                    "options_process_time": options_time,
                    "total_form_upload_time": total_time,
                    "validation_warnings": all_warnings,
                },
            )

        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
            raise
        finally:
            await file.seek(0)

    async def parse_file_only(self, file: UploadFile) -> Dict[str, Any]:
        """Parse an XLSForm and return a tempData.json-format schema without saving."""
        start_all = time.time()
        try:
            # ---- Try to read the workbook ------------------------------------
            try:
                df_dict = pd.read_excel(file.file, sheet_name=None)
            except Exception as e:
                msg = str(e)
                if "Excel file format cannot be determined" in msg:
                    err_type, err_msg = "invalid_file_format", (
                        "File is not a valid Excel file. "
                        "It may be a CSV file with .xlsx extension or corrupted."
                    )
                elif "password-protected" in msg.lower():
                    err_type, err_msg = "password_protected", "Excel file is password-protected."
                elif "corrupted" in msg.lower():
                    err_type, err_msg = "corrupted_file", "Excel file appears to be corrupted."
                else:
                    err_type, err_msg = "file_read_error", f"Failed to read Excel file: {msg}"
                return {
                    "valid": False,
                    "message": "Validation failed with 1 error(s) and 0 warning(s).",
                    "errors": [{"type": err_type, "message": err_msg, "location": "File structure", "row": None, "column": None}],
                    "warnings": [],
                    "file_name": file.filename,
                }

            all_errors: List[Dict] = []
            all_warnings: List[Dict] = []

            for sheet, required_cols in [
                ("Forms", self._validator.REQUIRED_FORMS_COLUMNS),
                ("Questions Info", self._validator.REQUIRED_QUESTIONS_COLUMNS),
                ("Answer Options", self._validator.REQUIRED_OPTIONS_COLUMNS),
            ]:
                v = self._validator._validate_sheet(df_dict, sheet, required_cols)
                if not v["exists"]:
                    all_errors.append({
                        "type": "missing_sheet",
                        "message": f'Required sheet "{sheet}" is missing',
                        "location": "File structure",
                        "row": None,
                        "column": None,
                    })
                else:
                    for col in v["missing_columns"]:
                        all_errors.append({
                            "type": "missing_column",
                            "message": f'Required column "{col}" is missing',
                            "location": f"{sheet} sheet",
                            "row": None,
                            "column": col,
                        })

            def _sheet_ok(name):
                v = self._validator._validate_sheet(
                    df_dict, name,
                    self._validator.REQUIRED_FORMS_COLUMNS if name == "Forms"
                    else self._validator.REQUIRED_QUESTIONS_COLUMNS if name == "Questions Info"
                    else self._validator.REQUIRED_OPTIONS_COLUMNS,
                )
                return v["exists"] and not v["missing_columns"]

            if _sheet_ok("Forms"):
                forms_df = df_dict["Forms"]
                if not forms_df.empty:
                    fe, fw, _ = self._validator._validate_forms_content(forms_df)
                    all_errors.extend(fe)
                    all_warnings.extend(fw)
                else:
                    all_errors.append({"type": "missing_data", "message": "Forms sheet is empty", "location": "Forms sheet", "row": None, "column": None})

            if _sheet_ok("Questions Info"):
                questions_df = df_dict["Questions Info"]
                if not questions_df.empty:
                    qe, qw = self._validator._validate_questions_content(questions_df)
                    all_errors.extend(qe)
                    all_warnings.extend(qw)
                else:
                    all_errors.append({"type": "missing_data", "message": "Questions Info sheet is empty", "location": "Questions Info sheet", "row": None, "column": None})

            if _sheet_ok("Answer Options"):
                options_df = df_dict["Answer Options"]
                if not options_df.empty:
                    oe, ow = self._validator._validate_options_content(options_df)
                    all_errors.extend(oe)
                    all_warnings.extend(ow)
                else:
                    all_warnings.append({"type": "missing_data", "message": "Answer Options sheet is empty", "location": "Answer Options sheet", "row": None, "column": None})

            if _sheet_ok("Questions Info") and _sheet_ok("Answer Options"):
                qdf = df_dict["Questions Info"]
                odf = df_dict["Answer Options"]
                if not qdf.empty and not odf.empty:
                    all_errors.extend(self._validator._validate_cross_references(qdf, odf))

            if all_errors:
                return {
                    "valid": False,
                    "message": f"Validation failed with {len(all_errors)} error(s) and {len(all_warnings)} warning(s).",
                    "errors": all_errors,
                    "warnings": all_warnings,
                    "file_name": file.filename,
                }

            forms_df = df_dict["Forms"]
            questions_df = df_dict["Questions Info"]
            options_df = df_dict["Answer Options"]

            questions_data = self._data_parser._parse_questions_data(questions_df)
            if not questions_data:
                raise Exception("No valid questions found in 'Questions Info' sheet.")

            self._data_parser._parse_options_data(options_df)  # validates options are parseable
            temp_data_format = self._template_builder._build_temp_data_format(forms_df, questions_df, options_df)

            total_time = time.time() - start_all
            log_metric("parse_only_time", total_time)
            return temp_data_format

        except Exception as e:
            logger.error(f"Error parsing file {file.filename}: {str(e)}")
            raise
        finally:
            await file.seek(0)
