import pandas as pd
from fastapi import UploadFile
from typing import Dict, List, Any, Optional
import uuid
from models.form import ParsedForm, FormGroup, Question
from services.database_service import DatabaseService
import logging
import time
import os

logger = logging.getLogger(__name__)

METRICS_FILE = os.path.join(os.path.dirname(__file__), '../metrics.txt')

def log_metric(metric_name, value):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    with open(METRICS_FILE, 'a') as f:
        f.write(f"[{timestamp}] {metric_name}: {value}\n")

class XLSFormParser:
    REQUIRED_SHEETS = ['Forms', 'Questions Info', 'Answer Options']
    REQUIRED_FORMS_COLUMNS = ['Language', 'Title']
    OPTIONAL_FORMS_COLUMNS = [
        'Version', 'Project Order', 'Village Order', 'Block Order', 'District Order', 
        'Gram Panchayat Order', 'Hamlet Order', 'Has Census', 'Is Active', 'Is Bulk Upload Draft',
        'Is Bulk Upload Response', 'Is Custom Label', 'Is Dashboard Disable', 'Is Draft Disable',
        'Is Dynamic Card', 'Is Livelihood', 'Is Master', 'Is Media', 'Is Online', 
        'Is Resource Repository', 'Is View Only', 'Is Visible To All', 'Is Preview Enabled',
        'Hide All Label', 'Main Form Id', 'Filter Data By', 'Filter Form Id',
        'Allow Preview Download', 'Parallel Import Call', 'Error Management Status',
        'Copied Form Id', 'Data Migrated', 'Enable Asr', 'Enable Tts', 'Is Auto Calculate',
        'Is Reference Data', 'Is Reset For Review Edit', 'Offline Review Edit'
    ]
    REQUIRED_QUESTIONS_COLUMNS = ['Order', 'Title', 'View Sequence', 'Input Type']
    REQUIRED_OPTIONS_COLUMNS = ['Order', 'Id', 'Label']

    SUPPORTED_QUESTION_TYPES = {
        1: 'text',
        2: 'select_one',
        3: 'select_multiple',
        4: 'integer',
        5: 'decimal',
        6: 'date',
        7: 'time',
        8: 'datetime',
        9: 'note',
        10: 'calculate'
    }

    VALID_LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ar', 'zh', 'ja', 'ko', 'hi', 'ru']

    def __init__(self):
        self.db_service = DatabaseService()

    async def validate_file(self, file: UploadFile) -> Dict[str, Any]:
        start_validation = time.time()
        try:
            df_dict = pd.read_excel(file.file, sheet_name=None)

            sheets_validation = []
            form_metadata = {}
            questions_count = 0
            options_count = 0
            errors = []
            warnings = []

            forms_validation = self._validate_sheet(
                df_dict, 'Forms', self.REQUIRED_FORMS_COLUMNS
            )
            sheets_validation.append(forms_validation)

            if not forms_validation['exists']:
                errors.append({
                    'type': 'missing_sheet',
                    'message': 'Required sheet "Forms" is missing',
                    'location': 'File structure',
                    'row': None,
                    'column': None
                })
            elif forms_validation['missing_columns']:
                for col in forms_validation['missing_columns']:
                    errors.append({
                        'type': 'missing_column',
                        'message': f'Required column "{col}" is missing',
                        'location': 'Forms sheet',
                        'row': None,
                        'column': col
                    })

            if forms_validation['exists']:
                if not forms_validation['missing_columns']:
                    forms_df = df_dict['Forms']
                    forms_errors, forms_warnings, form_metadata = self._validate_forms_content(forms_df)
                    errors.extend(forms_errors)
                    warnings.extend(forms_warnings)

            questions_validation = self._validate_sheet(
                df_dict, 'Questions Info', self.REQUIRED_QUESTIONS_COLUMNS
            )
            sheets_validation.append(questions_validation)

            if not questions_validation['exists']:
                errors.append({
                    'type': 'missing_sheet',
                    'message': 'Required sheet "Questions Info" is missing',
                    'location': 'File structure',
                    'row': None,
                    'column': None
                })
            elif questions_validation['missing_columns']:
                for col in questions_validation['missing_columns']:
                    errors.append({
                        'type': 'missing_column',
                        'message': f'Required column "{col}" is missing',
                        'location': 'Questions Info sheet',
                        'row': None,
                        'column': col
                    })

            if questions_validation['exists']:
                if not questions_validation['missing_columns']:
                    questions_df = df_dict['Questions Info']
                    questions_count = len(questions_df)
                    questions_errors, questions_warnings = self._validate_questions_content(questions_df)
                    errors.extend(questions_errors)
                    warnings.extend(questions_warnings)

            options_validation = self._validate_sheet(
                df_dict, 'Answer Options', self.REQUIRED_OPTIONS_COLUMNS
            )
            sheets_validation.append(options_validation)

            if not options_validation['exists']:
                errors.append({
                    'type': 'missing_sheet',
                    'message': 'Required sheet "Answer Options" is missing',
                    'location': 'File structure',
                    'row': None,
                    'column': None
                })
            elif options_validation['missing_columns']:
                for col in options_validation['missing_columns']:
                    errors.append({
                        'type': 'missing_column',
                        'message': f'Required column "{col}" is missing',
                        'location': 'Answer Options sheet',
                        'row': None,
                        'column': col
                    })

            if options_validation['exists']:
                if not options_validation['missing_columns']:
                    options_df = df_dict['Answer Options']
                    options_count = len(options_df)
                    options_errors, options_warnings = self._validate_options_content(options_df)
                    errors.extend(options_errors)
                    warnings.extend(options_warnings)

            if (questions_validation['exists'] and options_validation['exists'] and
                not questions_validation['missing_columns'] and not options_validation['missing_columns']):
                questions_df = df_dict['Questions Info']
                options_df = df_dict['Answer Options']
                cross_errors = self._validate_cross_references(questions_df, options_df)
                errors.extend(cross_errors)

            is_valid = (all(sheet['exists'] and not sheet['missing_columns'] for sheet in sheets_validation)
                       and len(errors) == 0)

            validation_time = time.time() - start_validation
            log_metric('validation_time_per_form', validation_time)

            return {
                'valid': is_valid,
                'message': "File format is valid." if is_valid else f"Found {len(errors)} error(s) and {len(warnings)} warning(s).",
                'sheets': sheets_validation,
                'form_metadata': form_metadata,
                'questions_count': questions_count,
                'options_count': options_count,
                'errors': errors,
                'warnings': warnings
            }

        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            return {
                'valid': False,
                'message': f"Error validating file: {str(e)}",
                'sheets': [],
                'form_metadata': {},
                'questions_count': 0,
                'options_count': 0,
                'errors': [{'type': 'file_error', 'message': f"Unable to read file: {str(e)}", 'location': 'file'}],
                'warnings': []
            }
        finally:
            await file.seek(0)

    def _validate_forms_content(self, forms_df: pd.DataFrame) -> tuple:
        """Validate Forms sheet content and return errors, warnings, and metadata"""
        errors = []
        warnings = []
        form_metadata = {}

        if forms_df.empty:
            errors.append({
                'type': 'missing_data',
                'message': 'Forms sheet is empty',
                'location': 'Forms sheet',
                'row': None,
                'column': None
            })
            return errors, warnings, form_metadata

        first_row = forms_df.iloc[0]

        if 'Language' in forms_df.columns:
            language = str(first_row['Language']).strip().lower()
            if pd.isna(first_row['Language']) or language == '':
                errors.append({
                    'type': 'missing_value',
                    'message': 'Language field is required',
                    'location': 'Forms sheet',
                    'row': 1,
                    'column': 'Language'
                })
            elif language not in self.VALID_LANGUAGES:
                warnings.append({
                    'type': 'invalid_language',
                    'message': f'Language "{language}" is not in the standard ISO 639-1 list. Supported: {", ".join(self.VALID_LANGUAGES)}',
                    'location': 'Forms sheet',
                    'row': 1,
                    'column': 'Language'
                })
            form_metadata['language'] = language

        if 'Title' in forms_df.columns:
            title = str(first_row['Title']).strip()
            if pd.isna(first_row['Title']) or title == '' or title == 'nan':
                errors.append({
                    'type': 'missing_value',
                    'message': 'Title field is required',
                    'location': 'Forms sheet',
                    'row': 1,
                    'column': 'Title'
                })
            elif len(title) > 255:
                errors.append({
                    'type': 'invalid_value',
                    'message': 'Title must be 255 characters or less',
                    'location': 'Forms sheet',
                    'row': 1,
                    'column': 'Title'
                })
            else:
                form_metadata['title'] = title

        if len(forms_df) > 1:
            warnings.append({
                'type': 'extra_data',
                'message': f'Forms sheet contains {len(forms_df)} rows, but only the first row is used',
                'location': 'Forms sheet',
                'row': None,
                'column': None
            })

        return errors, warnings, form_metadata

    def _validate_questions_content(self, questions_df: pd.DataFrame) -> tuple:
        """Validate Questions Info sheet content"""
        errors = []
        warnings = []

        if questions_df.empty:
            errors.append({
                'type': 'missing_data',
                'message': 'Questions Info sheet is empty',
                'location': 'Questions Info sheet',
                'row': None,
                'column': None
            })
            return errors, warnings

        seen_orders = set()
        seen_sequences = set()

        for idx, row in questions_df.iterrows():
            row_num = idx + 2  # +2 because pandas is 0-indexed and Excel headers are row 1

            try:
                order = int(row['Order'])
                if order <= 0:
                    errors.append({
                        'type': 'invalid_value',
                        'message': 'Order must be a positive integer',
                        'location': 'Questions Info sheet',
                        'row': row_num,
                        'column': 'Order'
                    })
                elif order in seen_orders:
                    errors.append({
                        'type': 'duplicate_value',
                        'message': f'Duplicate Order value: {order}',
                        'location': 'Questions Info sheet',
                        'row': row_num,
                        'column': 'Order'
                    })
                else:
                    seen_orders.add(order)
            except (ValueError, TypeError):
                errors.append({
                    'type': 'invalid_type',
                    'message': 'Order must be a valid integer',
                    'location': 'Questions Info sheet',
                    'row': row_num,
                    'column': 'Order'
                })

            title = str(row['Title']).strip()
            if pd.isna(row['Title']) or title == '' or title == 'nan':
                errors.append({
                    'type': 'missing_value',
                    'message': 'Title field is required',
                    'location': 'Questions Info sheet',
                    'row': row_num,
                    'column': 'Title'
                })
            elif len(title) > 1000:
                warnings.append({
                    'type': 'long_value',
                    'message': 'Title is very long (>1000 characters), consider shortening',
                    'location': 'Questions Info sheet',
                    'row': row_num,
                    'column': 'Title'
                })

            try:
                sequence = int(row['View Sequence'])
                if sequence <= 0:
                    errors.append({
                        'type': 'invalid_value',
                        'message': 'View Sequence must be a positive integer',
                        'location': 'Questions Info sheet',
                        'row': row_num,
                        'column': 'View Sequence'
                    })
                elif sequence in seen_sequences:
                    warnings.append({
                        'type': 'duplicate_value',
                        'message': f'Duplicate View Sequence value: {sequence}',
                        'location': 'Questions Info sheet',
                        'row': row_num,
                        'column': 'View Sequence'
                    })
                else:
                    seen_sequences.add(sequence)
            except (ValueError, TypeError):
                errors.append({
                    'type': 'invalid_type',
                    'message': 'View Sequence must be a valid integer',
                    'location': 'Questions Info sheet',
                    'row': row_num,
                    'column': 'View Sequence'
                })

            try:
                input_type = int(row['Input Type'])
                if input_type not in self.SUPPORTED_QUESTION_TYPES:
                    errors.append({
                        'type': 'unsupported_question_type',
                        'message': f'Unsupported Input Type: {input_type}. Supported types: {list(self.SUPPORTED_QUESTION_TYPES.keys())}',
                        'location': 'Questions Info sheet',
                        'row': row_num,
                        'column': 'Input Type'
                    })
            except (ValueError, TypeError):
                errors.append({
                    'type': 'invalid_type',
                    'message': 'Input Type must be a valid integer',
                    'location': 'Questions Info sheet',
                    'row': row_num,
                    'column': 'Input Type'
                })

        return errors, warnings

    def _validate_options_content(self, options_df: pd.DataFrame) -> tuple:
        """Validate Answer Options sheet content"""
        errors = []
        warnings = []

        if options_df.empty:
            warnings.append({
                'type': 'missing_data',
                'message': 'Answer Options sheet is empty - no multiple choice questions available',
                'location': 'Answer Options sheet',
                'row': None,
                'column': None
            })
            return errors, warnings

        seen_combinations = set()

        for idx, row in options_df.iterrows():
            row_num = idx + 2  # +2 because pandas is 0-indexed and Excel headers are row 1

            try:
                order = int(row['Order'])
                if order <= 0:
                    errors.append({
                        'type': 'invalid_value',
                        'message': 'Order must be a positive integer',
                        'location': 'Answer Options sheet',
                        'row': row_num,
                        'column': 'Order'
                    })
            except (ValueError, TypeError):
                errors.append({
                    'type': 'invalid_type',
                    'message': 'Order must be a valid integer',
                    'location': 'Answer Options sheet',
                    'row': row_num,
                    'column': 'Order'
                })
                continue

            try:
                option_id = int(row['Id'])
                if option_id <= 0:
                    errors.append({
                        'type': 'invalid_value',
                        'message': 'Id must be a positive integer',
                        'location': 'Answer Options sheet',
                        'row': row_num,
                        'column': 'Id'
                    })

                combination = (order, option_id)
                if combination in seen_combinations:
                    errors.append({
                        'type': 'duplicate_value',
                        'message': f'Duplicate Order+Id combination: ({order}, {option_id})',
                        'location': 'Answer Options sheet',
                        'row': row_num,
                        'column': 'Order+Id'
                    })
                else:
                    seen_combinations.add(combination)

            except (ValueError, TypeError):
                errors.append({
                    'type': 'invalid_type',
                    'message': 'Id must be a valid integer',
                    'location': 'Answer Options sheet',
                    'row': row_num,
                    'column': 'Id'
                })

            label = str(row['Label']).strip()
            if pd.isna(row['Label']) or label == '' or label == 'nan':
                errors.append({
                    'type': 'missing_value',
                    'message': 'Label field is required',
                    'location': 'Answer Options sheet',
                    'row': row_num,
                    'column': 'Label'
                })
            elif len(label) > 500:
                warnings.append({
                    'type': 'long_value',
                    'message': 'Label is very long (>500 characters), consider shortening',
                    'location': 'Answer Options sheet',
                    'row': row_num,
                    'column': 'Label'
                })

        return errors, warnings

    def _validate_cross_references(self, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[Dict]:
        """Validate cross-references between Questions and Options sheets"""
        errors = []

        choice_question_orders = set()
        question_orders = set()

        for idx, row in questions_df.iterrows():
            try:
                order = int(row['Order'])
                input_type = int(row['Input Type'])
                question_orders.add(order)

                if input_type in [2, 3]:
                    choice_question_orders.add(order)
            except (ValueError, TypeError):
                continue  # These errors are already caught in content validation

        option_orders = set()
        for idx, row in options_df.iterrows():
            try:
                order = int(row['Order'])
                option_orders.add(order)
            except (ValueError, TypeError):
                continue

        missing_options = choice_question_orders - option_orders
        for order in missing_options:
            errors.append({
                'type': 'missing_reference',
                'message': f'Question with Order {order} is a choice question but has no corresponding options',
                'location': 'Cross-reference validation',
                'row': None,
                'column': None
            })

        orphaned_options = option_orders - question_orders
        for order in orphaned_options:
            errors.append({
                'type': 'orphaned_reference',
                'message': f'Options exist for Order {order} but no corresponding question found',
                'location': 'Cross-reference validation',
                'row': None,
                'column': None
            })

        return errors

    def _validate_sheet(self, df_dict: Dict[str, pd.DataFrame], sheet_name: str, required_columns: List[str]) -> Dict[str, Any]:
        exists = sheet_name in df_dict
        columns = list(df_dict[sheet_name].columns) if exists else []
        missing_columns = [col for col in required_columns if col not in columns]
        row_count = len(df_dict[sheet_name]) if exists else 0

        return {
            'name': sheet_name,
            'exists': exists,
            'columns': columns,
            'required_columns': required_columns,
            'missing_columns': missing_columns,
            'row_count': row_count
        }

    async def parse_file(self, file: UploadFile) -> ParsedForm:
        start_all = time.time()
        try:
            df_dict = pd.read_excel(file.file, sheet_name=None)

            forms_df = df_dict['Forms']
            questions_df = df_dict['Questions Info']
            options_df = df_dict['Answer Options']

            # Run comprehensive validation checks before parsing/saving
            all_errors = []
            all_warnings = []

            # Validate Forms content
            forms_errors, forms_warnings, form_metadata = self._validate_forms_content(forms_df)
            all_errors.extend(forms_errors)
            all_warnings.extend(forms_warnings)

            # Validate Questions content
            questions_errors, questions_warnings = self._validate_questions_content(questions_df)
            all_errors.extend(questions_errors)
            all_warnings.extend(questions_warnings)

            # Validate Options content
            options_errors, options_warnings = self._validate_options_content(options_df)
            all_errors.extend(options_errors)
            all_warnings.extend(options_warnings)

            # Validate cross-references
            cross_errors = self._validate_cross_references(questions_df, options_df)
            all_errors.extend(cross_errors)

            # Fail if validation errors exist
            if all_errors:
                error_messages = []
                for error in all_errors:
                    location = f"{error['location']}"
                    if error.get('row'):
                        location += f" (row {error['row']})"
                    if error.get('column'):
                        location += f" (column {error['column']})"
                    error_messages.append(f"{error['message']} - {location}")
                
                # Create a detailed exception with structured error info
                exception_message = f"Validation failed with {len(all_errors)} error(s): " + "; ".join(error_messages)
                error = Exception(exception_message)
                error.validation_errors = all_errors
                error.validation_warnings = all_warnings
                raise error

            start_form = time.time()
            parsed_metadata = self._parse_form_metadata(forms_df)
            form_id = await self.db_service.save_form(parsed_metadata)
            form_time = time.time() - start_form
            log_metric('form_process_time', form_time)

            start_questions = time.time()
            questions_data = self._parse_questions_data(questions_df)
            question_ids = await self.db_service.save_questions(questions_data, form_id)
            questions_time = time.time() - start_questions
            log_metric('questions_process_time', questions_time)
            if len(questions_data) > 0:
                avg_question_time = questions_time / len(questions_data)
                log_metric('avg_one_question_process_time', avg_question_time)

            start_options = time.time()
            options_data = self._parse_options_data(options_df)
            option_ids = await self.db_service.save_options(options_data, form_id)
            options_time = time.time() - start_options
            log_metric('options_process_time', options_time)
            if len(options_data) > 0:
                avg_option_time = options_time / len(options_data)
                log_metric('avg_one_option_process_time', avg_option_time)

            form_title = self._get_form_title(forms_df)
            form_version = parsed_metadata.get('version', '1.0.0')
            groups = self._parse_questions(questions_df, options_df)

            total_time = time.time() - start_all
            log_metric('total_form_upload_time', total_time)

            return ParsedForm(
                id=form_id,
                title=form_title,
                version=form_version,
                groups=groups,
                settings=None,
                metadata={
                    'questions_count': len(questions_data),
                    'options_count': len(options_data),
                    'saved_question_ids': question_ids,
                    'saved_option_ids': option_ids,
                    'form_process_time': form_time,
                    'questions_process_time': questions_time,
                    'options_process_time': options_time,
                    'total_form_upload_time': total_time,
                    'validation_warnings': all_warnings
                }
            )

        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
            raise
        finally:
            await file.seek(0)

    async def parse_file_only(self, file: UploadFile) -> Dict[str, Any]:
        """Parse Excel file and return JSON schema in tempData.json format without saving to database"""
        start_all = time.time()
        try:
            # Step 1: Read Excel file
            try:
                df_dict = pd.read_excel(file.file, sheet_name=None)
                logger.info(f"Successfully loaded Excel file with sheets: {list(df_dict.keys())}")
            except Exception as e:
                error_message = str(e)
                if "Excel file format cannot be determined" in error_message:
                    return {
                        'valid': False,
                        'message': f"Validation failed with 1 error(s) and 0 warning(s).",
                        'errors': [{
                            'type': 'invalid_file_format',
                            'message': 'File is not a valid Excel file. The file may be a CSV file with .xlsx extension or corrupted.',
                            'location': 'File structure',
                            'row': None,
                            'column': None
                        }],
                        'warnings': [],
                        'file_name': file.filename
                    }
                elif "password-protected" in error_message.lower():
                    return {
                        'valid': False,
                        'message': f"Validation failed with 1 error(s) and 0 warning(s).",
                        'errors': [{
                            'type': 'password_protected',
                            'message': 'Excel file is password-protected and cannot be read.',
                            'location': 'File structure',
                            'row': None,
                            'column': None
                        }],
                        'warnings': [],
                        'file_name': file.filename
                    }
                elif "corrupted" in error_message.lower():
                    return {
                        'valid': False,
                        'message': f"Validation failed with 1 error(s) and 0 warning(s).",
                        'errors': [{
                            'type': 'corrupted_file',
                            'message': 'Excel file appears to be corrupted and cannot be read.',
                            'location': 'File structure',
                            'row': None,
                            'column': None
                        }],
                        'warnings': [],
                        'file_name': file.filename
                    }
                else:
                    return {
                        'valid': False,
                        'message': f"Validation failed with 1 error(s) and 0 warning(s).",
                        'errors': [{
                            'type': 'file_read_error',
                            'message': f'Failed to read Excel file: {error_message}. The file may be corrupted, password-protected, or not a valid Excel file.',
                            'location': 'File structure',
                            'row': None,
                            'column': None
                        }],
                        'warnings': [],
                        'file_name': file.filename
                    }

            # Step 2: Run comprehensive validation (same as validate_file method)
            all_errors = []
            all_warnings = []
            form_metadata = {}
            questions_count = 0
            options_count = 0

            # Validate sheet structure and columns
            forms_validation = self._validate_sheet(df_dict, 'Forms', self.REQUIRED_FORMS_COLUMNS)
            if not forms_validation['exists']:
                all_errors.append({
                    'type': 'missing_sheet',
                    'message': 'Required sheet "Forms" is missing',
                    'location': 'File structure',
                    'row': None,
                    'column': None
                })
            elif forms_validation['missing_columns']:
                for col in forms_validation['missing_columns']:
                    all_errors.append({
                        'type': 'missing_column',
                        'message': f'Required column "{col}" is missing',
                        'location': 'Forms sheet',
                        'row': None,
                        'column': col
                    })

            questions_validation = self._validate_sheet(df_dict, 'Questions Info', self.REQUIRED_QUESTIONS_COLUMNS)
            if not questions_validation['exists']:
                all_errors.append({
                    'type': 'missing_sheet',
                    'message': 'Required sheet "Questions Info" is missing',
                    'location': 'File structure',
                    'row': None,
                    'column': None
                })
            elif questions_validation['missing_columns']:
                for col in questions_validation['missing_columns']:
                    all_errors.append({
                        'type': 'missing_column',
                        'message': f'Required column "{col}" is missing',
                        'location': 'Questions Info sheet',
                        'row': None,
                        'column': col
                    })

            options_validation = self._validate_sheet(df_dict, 'Answer Options', self.REQUIRED_OPTIONS_COLUMNS)
            if not options_validation['exists']:
                all_errors.append({
                    'type': 'missing_sheet',
                    'message': 'Required sheet "Answer Options" is missing',
                    'location': 'File structure',
                    'row': None,
                    'column': None
                })
            elif options_validation['missing_columns']:
                for col in options_validation['missing_columns']:
                    all_errors.append({
                        'type': 'missing_column',
                        'message': f'Required column "{col}" is missing',
                        'location': 'Answer Options sheet',
                        'row': None,
                        'column': col
                    })

            # Step 3: Extract sheet data and validate content
            if forms_validation['exists'] and not forms_validation['missing_columns']:
                forms_df = df_dict['Forms']
                if not forms_df.empty:
                    forms_errors, forms_warnings, form_metadata = self._validate_forms_content(forms_df)
                    all_errors.extend(forms_errors)
                    all_warnings.extend(forms_warnings)
                else:
                    all_errors.append({
                        'type': 'missing_data',
                        'message': 'Forms sheet is empty',
                        'location': 'Forms sheet',
                        'row': None,
                        'column': None
                    })

            if questions_validation['exists'] and not questions_validation['missing_columns']:
                questions_df = df_dict['Questions Info']
                if not questions_df.empty:
                    questions_count = len(questions_df)
                    questions_errors, questions_warnings = self._validate_questions_content(questions_df)
                    all_errors.extend(questions_errors)
                    all_warnings.extend(questions_warnings)
                else:
                    all_errors.append({
                        'type': 'missing_data',
                        'message': 'Questions Info sheet is empty',
                        'location': 'Questions Info sheet',
                        'row': None,
                        'column': None
                    })

            if options_validation['exists'] and not options_validation['missing_columns']:
                options_df = df_dict['Answer Options']
                if not options_df.empty:
                    options_count = len(options_df)
                    options_errors, options_warnings = self._validate_options_content(options_df)
                    all_errors.extend(options_errors)
                    all_warnings.extend(options_warnings)
                else:
                    all_warnings.append({
                        'type': 'missing_data',
                        'message': 'Answer Options sheet is empty - no multiple choice questions available',
                        'location': 'Answer Options sheet',
                        'row': None,
                        'column': None
                    })

            # Step 4: Validate cross-references if both sheets exist and have data
            if (questions_validation['exists'] and options_validation['exists'] and
                not questions_validation['missing_columns'] and not options_validation['missing_columns']):
                questions_df = df_dict['Questions Info']
                options_df = df_dict['Answer Options']
                if not questions_df.empty and not options_df.empty:
                    cross_errors = self._validate_cross_references(questions_df, options_df)
                    all_errors.extend(cross_errors)

            # Step 5: Check if validation passed - return validation errors instead of parsing
            if all_errors:
                return {
                    'valid': False,
                    'message': f"Validation failed with {len(all_errors)} error(s) and {len(all_warnings)} warning(s).",
                    'errors': all_errors,
                    'warnings': all_warnings,
                    'file_name': file.filename
                }

            # Step 6: Parse data only if validation passes
            try:
                forms_df = df_dict['Forms']
                questions_df = df_dict['Questions Info']
                options_df = df_dict['Answer Options']
                
                questions_data = self._parse_questions_data(questions_df)
                logger.info(f"Parsed {len(questions_data)} questions")
                if not questions_data:
                    raise Exception("No valid questions found. Check that the 'Questions Info' sheet has data with proper Order, Title, View Sequence, and Input Type values.")
            except Exception as e:
                raise Exception(f"Failed to parse questions from 'Questions Info' sheet: {str(e)}. Check data types: Order and View Sequence should be integers, Input Type should be a valid type (1-10).")

            try:
                options_data = self._parse_options_data(options_df)
                logger.info(f"Parsed {len(options_data)} options")
            except Exception as e:
                raise Exception(f"Failed to parse options from 'Answer Options' sheet: {str(e)}. Check data types: Order and Id should be integers, Label should be text.")

            # Step 7: Build tempData.json format
            try:
                temp_data_format = self._build_temp_data_format(forms_df, questions_df, options_df)
                logger.info(f"Built tempData format with form definition")
            except Exception as e:
                raise Exception(f"Failed to build tempData format: {str(e)}. This may be due to data inconsistencies between questions and options.")

            total_time = time.time() - start_all
            log_metric('parse_only_time', total_time)

            return temp_data_format

        except Exception as e:
            logger.error(f"Error parsing file {file.filename}: {str(e)}")
            raise
        finally:
            await file.seek(0)

    def _parse_form_metadata(self, forms_df: pd.DataFrame) -> Dict[str, Any]:
        """Parse form metadata from Forms sheet"""
        metadata = {
            'language': 'en',
            'title': 'Untitled Form',
            'version': '1.0.0',
            'created_at': pd.Timestamp.now().isoformat()
        }

        if not forms_df.empty:
            first = forms_df.iloc[0]
            if 'Language' in forms_df.columns and pd.notna(first['Language']):
                metadata['language'] = str(first['Language']).strip()
            if 'Title' in forms_df.columns and pd.notna(first['Title']):
                metadata['title'] = str(first['Title']).strip()
            if 'Version' in forms_df.columns and pd.notna(first['Version']):
                metadata['version'] = str(first['Version']).strip()
            if 'Created At' in forms_df.columns and pd.notna(first['Created At']):
                try:
                    metadata['created_at'] = pd.to_datetime(first['Created At']).isoformat()
                except Exception:
                    pass

        return metadata

    def _parse_questions_data(self, questions_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse questions data for database storage"""
        questions_data = []

        for _, row in questions_df.iterrows():
            question_data = {
                'order': int(row['Order']),
                'title': str(row['Title']),
                'view_sequence': int(row['View Sequence']),
                'input_type': int(row['Input Type']),
                'created_at': pd.Timestamp.now().isoformat()
            }
            questions_data.append(question_data)

        return questions_data

    def _parse_options_data(self, options_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse options data for database storage"""
        options_data = []

        for _, row in options_df.iterrows():
            option_data = {
                'order': int(row['Order']),
                'option_id': int(row['Id']),
                'label': str(row['Label']),
                'created_at': pd.Timestamp.now().isoformat()
            }
            options_data.append(option_data)

        return options_data

    def _get_form_title(self, forms_df: pd.DataFrame) -> Dict[str, str]:
        if not forms_df.empty and 'Title' in forms_df.columns:
            title = forms_df.iloc[0]['Title']
            return {'default': title}
        return {'default': 'Untitled Form'}

    def _parse_questions(self, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[FormGroup]:
        group = FormGroup(
            name='default',
            label={'default': 'Default Group'},
            questions=[]
        )

        for _, row in questions_df.iterrows():
            question = self._parse_question(row, options_df)
            group.questions.append(question)

        return [group]

    def _parse_question(self, row: pd.Series, options_df: pd.DataFrame) -> Question:
        input_type = str(row['Input Type']).lower()
        question_data = {
            'type': input_type,
            'name': str(row['Order']),
            'label': {'default': row['Title']},
            'required': False,
            'appearance': None,
            'relevant': None,
            'calculation': None,
            'default': None,
            'hint': None
        }

        matching_choices = options_df[options_df['Order'] == row['Order']]
        if not matching_choices.empty:
            question_data['choices'] = [
                {
                    'name': str(choice['Id']),
                    'label': {'default': choice['Label']}
                }
                for _, choice in matching_choices.iterrows()
            ]

        return Question(**question_data)

    def _generate_object_id(self) -> str:
        """Generate a mock ObjectId string for the tempData format"""
        import random
        import string
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=24))

    def _extract_form_config(self, forms_df: pd.DataFrame) -> Dict[str, Any]:
        """Extract form configuration from Forms sheet with sensible defaults"""
        config = {
            # Basic metadata
            'title': 'Untitled Form',
            'language': 'en',
            'version': '1',
            
            # Order settings
            'projectOrder': 0,
            'villageOrder': 5,
            'blockOrder': 3,
            'districtOrder': 2,
            'gramPanchayatOrder': 4,
            'hamletOrder': 0,
            
            # Feature flags
            'hasCensus': False,
            'isActive': True,
            'isBulkUploadDraft': False,
            'isBulkUploadResponse': True,
            'isCustomLabel': True,
            'isDashboardDisable': False,
            'isDraftDisable': False,
            'isDynamicCard': False,
            'isLivelihood': True,
            'isMaster': False,
            'isMedia': False,
            'isOnline': False,
            'isResourceRepository': False,
            'isViewOnly': False,
            'isVisibleToAll': False,
            'isPreviewEnabled': True,
            'hideAllLabel': False,
            'allowPreviewDownload': False,
            'parallelImportCall': True,
            'errorManagementStatus': True,
            'dataMigrated': False,
            'enableAsr': False,
            'enableTts': False,
            'isAutoCalculate': False,
            'isReferenceData': False,
            'isResetForReviewEdit': False,
            'offlineReviewEdit': False,
            
            # References
            'mainFormId': None,
            'filterFormId': None,
            'copiedFormId': 125,
            
            # Arrays
            'filterDataBy': ['GEOGRAPHY'],
            'tags': []
        }
        
        if not forms_df.empty:
            first_row = forms_df.iloc[0]
            
            # Extract basic metadata
            if 'Title' in forms_df.columns and pd.notna(first_row['Title']):
                config['title'] = str(first_row['Title']).strip()
            if 'Language' in forms_df.columns and pd.notna(first_row['Language']):
                config['language'] = str(first_row['Language']).strip().lower()
            if 'Version' in forms_df.columns and pd.notna(first_row['Version']):
                config['version'] = str(first_row['Version']).strip()
            
            # Extract order settings
            order_mappings = {
                'Project Order': 'projectOrder',
                'Village Order': 'villageOrder',
                'Block Order': 'blockOrder',
                'District Order': 'districtOrder',
                'Gram Panchayat Order': 'gramPanchayatOrder',
                'Hamlet Order': 'hamletOrder'
            }
            
            for excel_col, config_key in order_mappings.items():
                if excel_col in forms_df.columns and pd.notna(first_row[excel_col]):
                    try:
                        config[config_key] = int(first_row[excel_col])
                    except (ValueError, TypeError):
                        pass  # Keep default value
            
            # Extract boolean flags
            boolean_mappings = {
                'Has Census': 'hasCensus',
                'Is Active': 'isActive',
                'Is Bulk Upload Draft': 'isBulkUploadDraft',
                'Is Bulk Upload Response': 'isBulkUploadResponse',
                'Is Custom Label': 'isCustomLabel',
                'Is Dashboard Disable': 'isDashboardDisable',
                'Is Draft Disable': 'isDraftDisable',
                'Is Dynamic Card': 'isDynamicCard',
                'Is Livelihood': 'isLivelihood',
                'Is Master': 'isMaster',
                'Is Media': 'isMedia',
                'Is Online': 'isOnline',
                'Is Resource Repository': 'isResourceRepository',
                'Is View Only': 'isViewOnly',
                'Is Visible To All': 'isVisibleToAll',
                'Is Preview Enabled': 'isPreviewEnabled',
                'Hide All Label': 'hideAllLabel',
                'Allow Preview Download': 'allowPreviewDownload',
                'Parallel Import Call': 'parallelImportCall',
                'Error Management Status': 'errorManagementStatus',
                'Data Migrated': 'dataMigrated',
                'Enable Asr': 'enableAsr',
                'Enable Tts': 'enableTts',
                'Is Auto Calculate': 'isAutoCalculate',
                'Is Reference Data': 'isReferenceData',
                'Is Reset For Review Edit': 'isResetForReviewEdit',
                'Offline Review Edit': 'offlineReviewEdit'
            }
            
            for excel_col, config_key in boolean_mappings.items():
                if excel_col in forms_df.columns and pd.notna(first_row[excel_col]):
                    value = str(first_row[excel_col]).strip().lower()
                    if value in ['true', '1', 'yes', 'y']:
                        config[config_key] = True
                    elif value in ['false', '0', 'no', 'n']:
                        config[config_key] = False
            
            # Extract reference IDs
            reference_mappings = {
                'Main Form Id': 'mainFormId',
                'Filter Form Id': 'filterFormId',
                'Copied Form Id': 'copiedFormId'
            }
            
            for excel_col, config_key in reference_mappings.items():
                if excel_col in forms_df.columns and pd.notna(first_row[excel_col]):
                    try:
                        value = first_row[excel_col]
                        if pd.notna(value) and str(value).strip():
                            config[config_key] = int(value) if str(value).isdigit() else str(value).strip()
                    except (ValueError, TypeError):
                        pass  # Keep default value
            
            # Extract filter data by (comma-separated list)
            if 'Filter Data By' in forms_df.columns and pd.notna(first_row['Filter Data By']):
                filter_by_str = str(first_row['Filter Data By']).strip()
                if filter_by_str:
                    config['filterDataBy'] = [item.strip().upper() for item in filter_by_str.split(',')]
            
            # Extract tags (comma-separated list)
            if 'Tags' in forms_df.columns and pd.notna(first_row['Tags']):
                tags_str = str(first_row['Tags']).strip()
                if tags_str:
                    config['tags'] = [item.strip() for item in tags_str.split(',')]
        
        return config

    def _extract_db_form_config(self, form: Dict[str, Any]) -> Dict[str, Any]:
        """Extract form configuration from database form data with sensible defaults"""
        config = {
            # Basic metadata
            'title': form.get('title', 'Untitled Form'),
            'language': form.get('language', 'en'),
            'version': str(form.get('version', '1')),
            
            # Order settings (use sensible defaults since DB forms don't store these)
            'projectOrder': 0,
            'villageOrder': 5,
            'blockOrder': 3,
            'districtOrder': 2,
            'gramPanchayatOrder': 4,
            'hamletOrder': 0,
            
            # Feature flags (sensible defaults)
            'hasCensus': False,
            'isActive': True,
            'isBulkUploadDraft': False,
            'isBulkUploadResponse': True,
            'isCustomLabel': True,
            'isDashboardDisable': False,
            'isDraftDisable': False,
            'isDynamicCard': False,
            'isLivelihood': True,
            'isMaster': False,
            'isMedia': False,
            'isOnline': False,
            'isResourceRepository': False,
            'isViewOnly': False,
            'isVisibleToAll': False,
            'isPreviewEnabled': True,
            'hideAllLabel': False,
            'allowPreviewDownload': False,
            'parallelImportCall': True,
            'errorManagementStatus': True,
            'dataMigrated': False,
            'enableAsr': False,
            'enableTts': False,
            'isAutoCalculate': False,
            'isReferenceData': False,
            'isResetForReviewEdit': False,
            'offlineReviewEdit': False,
            
            # References
            'mainFormId': None,
            'filterFormId': None,
            'copiedFormId': int(form.get('id', 125)),  # Use current form ID as copied from
            
            # Arrays
            'filterDataBy': ['GEOGRAPHY'],
            'tags': []
        }
        
        return config

    def _build_temp_data_format(self, forms_df: pd.DataFrame, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Build the tempData.json format structure"""
        from datetime import datetime, timezone
        import pandas as pd
        
        # Extract form configuration from Forms sheet
        config = self._extract_form_config(forms_df)
        
        # Build the form definition object (similar to Object 2 in tempData.json)
        form_definition = {
            "_id": f"ObjectId(\"{self._generate_object_id()}\")",
            "formUiniqueId": f"ObjectId(\"{self._generate_object_id()}\")",
            "formId": 848,
            "parentResponseId": None,
            "groupResponseId": None,
            "transactionId": str(uuid.uuid4()),
            "forParentValue": None,
            "uniqueId": f"generated_form_{int(datetime.now().timestamp())}",
            "userId": f"ObjectId(\"{self._generate_object_id()}\")",
            "partner": f"ObjectId(\"{self._generate_object_id()}\")",
            "project": f"ObjectId(\"{self._generate_object_id()}\")",
            "loginId": f"ObjectId(\"{self._generate_object_id()}\")",
            "version": config['version'],
            "dataMigrated": config['dataMigrated'],
            "hamlet": None,
            "village": f"ObjectId(\"{self._generate_object_id()}\")",
            "gramPanchayat": f"ObjectId(\"{self._generate_object_id()}\")",
            "block": f"ObjectId(\"{self._generate_object_id()}\")",
            "district": f"ObjectId(\"{self._generate_object_id()}\")",
            "state": f"ObjectId(\"{self._generate_object_id()}\")",
            "location": {
                "lat": "0.0",
                "lng": "0.0",
                "accuracy": "0.0"
            },
            "language": config['language'],
            "backgroundVoice": None,
            "question": self._build_response_questions(questions_df, options_df),
            "responseUpdateHistory": [],
            "appVersion": "2.5.3",
            "responseIds": [],
            "mobileCreatedAt": f"ISODate(\"{datetime.now(timezone.utc).isoformat()}\")",
            "createdAt": f"ISODate(\"{datetime.now(timezone.utc).isoformat()}\")",
            "updatedAt": f"ISODate(\"{datetime.now(timezone.utc).isoformat()}\")",
            "blockOrder": config['blockOrder'],
            "districtOrder": config['districtOrder'],
            "gramPanchayatOrder": config['gramPanchayatOrder'],
            "hamletOrder": config['hamletOrder'],
            "hasCensus": config['hasCensus'],
            "hooks": [],
            "isActive": config['isActive'],
            "isBulkUploadDraft": config['isBulkUploadDraft'],
            "isBulkUploadResponse": config['isBulkUploadResponse'],
            "isCustomLabel": config['isCustomLabel'],
            "isDashboardDisable": config['isDashboardDisable'],
            "isDraftDisable": config['isDraftDisable'],
            "isDynamicCard": config['isDynamicCard'],
            "isLivelihood": config['isLivelihood'],
            "isMaster": config['isMaster'],
            "isMedia": config['isMedia'],
            "isOnline": config['isOnline'],
            "isResourceRepository": config['isResourceRepository'],
            "isViewOnly": config['isViewOnly'],
            "isVisibleToAll": config['isVisibleToAll'],
            "keyInfoOrders": self._get_key_info_orders(questions_df),
            "language": [
                {
                    "lng": config['language'],
                    "title": config['title'],
                    "buttons": [],
                    "question": self._build_form_questions(questions_df, options_df)
                }
            ],
            "syncStatus": {
                "groupBy": "5",
                "filterBy": config['filterDataBy'],
                "conditions": [],
                "questions": self._build_sync_questions(questions_df),
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            },
            "version": config['version'],
            "villageOrder": config['villageOrder'],
            "googleSheet": {},
            "actions": [],
            "isPreviewEnabled": config['isPreviewEnabled'],
            "projects": [],
            "hideAllLabel": config['hideAllLabel'],
            "mainFormId": config['mainFormId'],
            "projectOrder": config['projectOrder'],
            "filterDataBy": config['filterDataBy'],
            "filterFormId": config['filterFormId'],
            "maskingConfig": [],
            "encryptedQuestions": [],
            "allowPreviewDownload": config['allowPreviewDownload'],
            "parallelImportCall": config['parallelImportCall'],
            "errorManagementStatus": config['errorManagementStatus'],
            "searchOrders": [],
            "copiedFormId": config['copiedFormId'],
            "dataMigrated": config['dataMigrated'],
            "enableAsr": config['enableAsr'],
            "enableTts": config['enableTts'],
            "isAutoCalculate": config['isAutoCalculate'],
            "isReferenceData": config['isReferenceData'],
            "isResetForReviewEdit": config['isResetForReviewEdit'],
            "metaDataConfig": [],
            "offlineReviewEdit": config['offlineReviewEdit'],
            "tags": config['tags']
        }
        
        return [form_definition]

    def _build_response_questions(self, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Build question array for response format (Object 1 style)"""
        questions = []
        
        for _, row in questions_df.iterrows():
            order = str(row['Order'])
            input_type = str(row['Input Type'])
            
            # Get matching options for this question
            matching_options = options_df[options_df['Order'] == int(order)]
            answer_data = []
            initial_answer_data = []
            
            if not matching_options.empty:
                # Use first option as default answer for choice questions
                first_option = matching_options.iloc[0]
                answer_data = [{
                    "value": str(first_option['Id']),
                    "label": str(first_option['Label']),
                    "_id": f"ObjectId(\"{self._generate_object_id()}\")"
                }]
                initial_answer_data = [{
                    "value": str(first_option['Id']),
                    "label": str(first_option['Label']),
                    "_id": f"ObjectId(\"{self._generate_object_id()}\")"
                }]
            
            question = {
                "order": order,
                "input_type": input_type,
                "answer": answer_data,
                "intialAnswer": initial_answer_data,
                "history": [],
                "nestedAnswer": [],
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            }
            questions.append(question)
        
        return questions

    def _build_form_questions(self, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Build detailed question definitions for form language section"""
        questions = []
        
        for _, row in questions_df.iterrows():
            order = str(row['Order'])
            input_type = str(row['Input Type'])
            title = str(row['Title'])
            view_sequence = str(row.get('View Sequence', order))
            
            # Get matching options for this question
            matching_options = options_df[options_df['Order'] == int(order)]
            answer_options = []
            
            if not matching_options.empty:
                for _, option_row in matching_options.iterrows():
                    answer_options.append({
                        "_id": str(option_row['Id']),
                        "name": str(option_row['Label']),
                        "shortKey": "",
                        "visibility": None,
                        "did": [],
                        "viewSequence": str(option_row['Id']),
                        "coordinates": []
                    })
            
            question = {
                "order": order,
                "label": order,
                "title": title,
                "shortKey": f"question_{order}",
                "information": "",
                "viewSequence": view_sequence,
                "input_type": input_type,
                "validation": [
                    {
                        "_id": "1",
                        "error_msg": "",
                        "condition": None
                    }
                ],
                "answer_option": answer_options,
                "restrictions": [],
                "child": [],
                "parent": [],
                "hint": "",
                "error_msg": "",
                "resource_urls": [],
                "editable": False,
                "weightage": [],
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            }
            questions.append(question)
        
        return questions

    def _build_sync_questions(self, questions_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Build sync status questions configuration"""
        sync_questions = []
        
        for _, row in questions_df.iterrows():
            order = str(row['Order'])
            
            sync_question = {
                "order": order,
                "key": f"order{order}",
                "clear": False,
                "edit": True,
                "setDefault": None,
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            }
            sync_questions.append(sync_question)
        
        return sync_questions

    def _get_key_info_orders(self, questions_df: pd.DataFrame) -> List[str]:
        """Get key info orders from questions (first few questions typically)"""
        orders = []
        for _, row in questions_df.iterrows():
            orders.append(str(row['Order']))
            if len(orders) >= 7:  # Limit to first 7 as seen in tempData.json
                break
        return orders

    def _convert_db_to_temp_data_format(self, form: Dict[str, Any], questions: List[Dict[str, Any]], options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert database format (form, questions, options) to tempData.json format"""
        from datetime import datetime, timezone
        
        # Extract configuration with sensible defaults (database forms have limited metadata)
        config = self._extract_db_form_config(form)
        
        # Build the form definition object (similar to Object 2 in tempData.json)
        form_definition = {
            "_id": f"ObjectId(\"{self._generate_object_id()}\")",
            "formUiniqueId": f"ObjectId(\"{form.get('id', self._generate_object_id())}\")",
            "formId": int(form.get('id', 848)),
            "parentResponseId": None,
            "groupResponseId": None,
            "transactionId": str(uuid.uuid4()),
            "forParentValue": None,
            "uniqueId": f"db_form_{form.get('id', 'unknown')}_{int(datetime.now().timestamp())}",
            "userId": f"ObjectId(\"{self._generate_object_id()}\")",
            "partner": f"ObjectId(\"{self._generate_object_id()}\")",
            "project": f"ObjectId(\"{self._generate_object_id()}\")",
            "loginId": f"ObjectId(\"{self._generate_object_id()}\")",
            "version": config['version'],
            "dataMigrated": config['dataMigrated'],
            "hamlet": None,
            "village": f"ObjectId(\"{self._generate_object_id()}\")",
            "gramPanchayat": f"ObjectId(\"{self._generate_object_id()}\")",
            "block": f"ObjectId(\"{self._generate_object_id()}\")",
            "district": f"ObjectId(\"{self._generate_object_id()}\")",
            "state": f"ObjectId(\"{self._generate_object_id()}\")",
            "location": {
                "lat": "0.0",
                "lng": "0.0",
                "accuracy": "0.0"
            },
            "language": config['language'],
            "backgroundVoice": None,
            "question": self._build_response_questions_from_db(questions, options),
            "responseUpdateHistory": [],
            "appVersion": "2.5.3",
            "responseIds": [],
            "mobileCreatedAt": f"ISODate(\"{form.get('created_at', datetime.now(timezone.utc).isoformat())}\")",
            "createdAt": f"ISODate(\"{form.get('created_at', datetime.now(timezone.utc).isoformat())}\")",
            "updatedAt": f"ISODate(\"{datetime.now(timezone.utc).isoformat()}\")",
            "blockOrder": config['blockOrder'],
            "districtOrder": config['districtOrder'],
            "gramPanchayatOrder": config['gramPanchayatOrder'],
            "hamletOrder": config['hamletOrder'],
            "hasCensus": config['hasCensus'],
            "hooks": [],
            "isActive": config['isActive'],
            "isBulkUploadDraft": config['isBulkUploadDraft'],
            "isBulkUploadResponse": config['isBulkUploadResponse'],
            "isCustomLabel": config['isCustomLabel'],
            "isDashboardDisable": config['isDashboardDisable'],
            "isDraftDisable": config['isDraftDisable'],
            "isDynamicCard": config['isDynamicCard'],
            "isLivelihood": config['isLivelihood'],
            "isMaster": config['isMaster'],
            "isMedia": config['isMedia'],
            "isOnline": config['isOnline'],
            "isResourceRepository": config['isResourceRepository'],
            "isViewOnly": config['isViewOnly'],
            "isVisibleToAll": config['isVisibleToAll'],
            "keyInfoOrders": self._get_key_info_orders_from_db(questions),
            "language": [
                {
                    "lng": config['language'],
                    "title": config['title'],
                    "buttons": [],
                    "question": self._build_form_questions_from_db(questions, options)
                }
            ],
            "syncStatus": {
                "groupBy": "5",
                "filterBy": config['filterDataBy'],
                "conditions": [],
                "questions": self._build_sync_questions_from_db(questions),
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            },
            "version": config['version'],
            "villageOrder": config['villageOrder'],
            "googleSheet": {},
            "actions": [],
            "isPreviewEnabled": config['isPreviewEnabled'],
            "projects": [],
            "hideAllLabel": config['hideAllLabel'],
            "mainFormId": config['mainFormId'],
            "projectOrder": config['projectOrder'],
            "filterDataBy": config['filterDataBy'],
            "filterFormId": config['filterFormId'],
            "maskingConfig": [],
            "encryptedQuestions": [],
            "allowPreviewDownload": config['allowPreviewDownload'],
            "parallelImportCall": config['parallelImportCall'],
            "errorManagementStatus": config['errorManagementStatus'],
            "searchOrders": [],
            "copiedFormId": config['copiedFormId'],
            "dataMigrated": config['dataMigrated'],
            "enableAsr": config['enableAsr'],
            "enableTts": config['enableTts'],
            "isAutoCalculate": config['isAutoCalculate'],
            "isReferenceData": config['isReferenceData'],
            "isResetForReviewEdit": config['isResetForReviewEdit'],
            "metaDataConfig": [],
            "offlineReviewEdit": config['offlineReviewEdit'],
            "tags": config['tags']
        }
        
        return [form_definition]

    def _build_response_questions_from_db(self, questions: List[Dict[str, Any]], options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Build question array for response format from database data"""
        response_questions = []
        
        for question in questions:
            order = str(question['order'])
            input_type = str(question['input_type'])
            
            # Get matching options for this question
            matching_options = [opt for opt in options if opt['order'] == question['order']]
            answer_data = []
            initial_answer_data = []
            
            if matching_options:
                # Use first option as default answer for choice questions
                first_option = matching_options[0]
                answer_data = [{
                    "value": str(first_option['option_id']),
                    "label": str(first_option['label']),
                    "_id": f"ObjectId(\"{self._generate_object_id()}\")"
                }]
                initial_answer_data = [{
                    "value": str(first_option['option_id']),
                    "label": str(first_option['label']),
                    "_id": f"ObjectId(\"{self._generate_object_id()}\")"
                }]
            
            response_question = {
                "order": order,
                "input_type": input_type,
                "answer": answer_data,
                "intialAnswer": initial_answer_data,
                "history": [],
                "nestedAnswer": [],
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            }
            response_questions.append(response_question)
        
        return response_questions

    def _build_form_questions_from_db(self, questions: List[Dict[str, Any]], options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Build detailed question definitions from database data"""
        form_questions = []
        
        for question in questions:
            order = str(question['order'])
            input_type = str(question['input_type'])
            title = str(question['title'])
            view_sequence = str(question.get('view_sequence', question['order']))
            
            # Get matching options for this question
            matching_options = [opt for opt in options if opt['order'] == question['order']]
            answer_options = []
            
            for option in matching_options:
                answer_options.append({
                    "_id": str(option['option_id']),
                    "name": str(option['label']),
                    "shortKey": "",
                    "visibility": None,
                    "did": [],
                    "viewSequence": str(option['option_id']),
                    "coordinates": []
                })
            
            form_question = {
                "order": order,
                "label": order,
                "title": title,
                "shortKey": f"question_{order}",
                "information": "",
                "viewSequence": view_sequence,
                "input_type": input_type,
                "validation": [
                    {
                        "_id": "1",
                        "error_msg": "",
                        "condition": None
                    }
                ],
                "answer_option": answer_options,
                "restrictions": [],
                "child": [],
                "parent": [],
                "hint": "",
                "error_msg": "",
                "resource_urls": [],
                "editable": False,
                "weightage": [],
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            }
            form_questions.append(form_question)
        
        return form_questions

    def _build_sync_questions_from_db(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Build sync status questions from database data"""
        sync_questions = []
        
        for question in questions:
            order = str(question['order'])
            
            sync_question = {
                "order": order,
                "key": f"order{order}",
                "clear": False,
                "edit": True,
                "setDefault": None,
                "_id": f"ObjectId(\"{self._generate_object_id()}\")"
            }
            sync_questions.append(sync_question)
        
        return sync_questions

    def _get_key_info_orders_from_db(self, questions: List[Dict[str, Any]]) -> List[str]:
        """Get key info orders from database questions"""
        orders = []
        for question in questions:
            orders.append(str(question['order']))
            if len(orders) >= 7:  # Limit to first 7 as seen in tempData.json
                break
        return orders

