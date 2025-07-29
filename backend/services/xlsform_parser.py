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

            start_form = time.time()
            form_metadata = self._parse_form_metadata(forms_df)
            form_id = await self.db_service.save_form(form_metadata)
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
            form_version = '1.0.0'
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
                    'total_form_upload_time': total_time
                }
            )

        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
            raise
        finally:
            await file.seek(0)

    async def parse_file_only(self, file: UploadFile) -> Dict[str, Any]:
        """Parse Excel file and return JSON schema without saving to database"""
        start_all = time.time()
        try:
            # Step 1: Read Excel file
            try:
                df_dict = pd.read_excel(file.file, sheet_name=None)
                logger.info(f"Successfully loaded Excel file with sheets: {list(df_dict.keys())}")
            except Exception as e:
                raise Exception(f"Failed to read Excel file: {str(e)}. The file may be corrupted, password-protected, or not a valid Excel file.")

            # Step 2: Validate required sheets exist
            required_sheets = self.REQUIRED_SHEETS
            available_sheets = list(df_dict.keys())
            missing_sheets = [sheet for sheet in required_sheets if sheet not in available_sheets]
            
            if missing_sheets:
                raise Exception(f"Missing required sheets: {missing_sheets}. Found sheets: {available_sheets}. Required sheets are: {required_sheets}")

            # Step 3: Extract sheet data with validation
            try:
                forms_df = df_dict['Forms']
                if forms_df.empty:
                    raise Exception("The 'Forms' sheet is empty. Please add form metadata with required columns: Language, Title")
                logger.info(f"Forms sheet loaded with {len(forms_df)} rows")
            except KeyError:
                raise Exception("Sheet 'Forms' not found. Please ensure the sheet name is exactly 'Forms' (case-sensitive)")
            except Exception as e:
                raise Exception(f"Error loading 'Forms' sheet: {str(e)}")

            try:
                questions_df = df_dict['Questions Info']
                if questions_df.empty:
                    raise Exception("The 'Questions Info' sheet is empty. Please add questions with required columns: Order, Title, View Sequence, Input Type")
                logger.info(f"Questions Info sheet loaded with {len(questions_df)} rows")
            except KeyError:
                raise Exception("Sheet 'Questions Info' not found. Please ensure the sheet name is exactly 'Questions Info' (case-sensitive)")
            except Exception as e:
                raise Exception(f"Error loading 'Questions Info' sheet: {str(e)}")

            try:
                options_df = df_dict['Answer Options']
                if options_df.empty:
                    raise Exception("The 'Answer Options' sheet is empty. Please add answer options with required columns: Order, Id, Label")
                logger.info(f"Answer Options sheet loaded with {len(options_df)} rows")
            except KeyError:
                raise Exception("Sheet 'Answer Options' not found. Please ensure the sheet name is exactly 'Answer Options' (case-sensitive)")
            except Exception as e:
                raise Exception(f"Error loading 'Answer Options' sheet: {str(e)}")

            # Step 4: Validate column headers
            try:
                missing_form_cols = [col for col in self.REQUIRED_FORMS_COLUMNS if col not in forms_df.columns]
                if missing_form_cols:
                    raise Exception(f"Forms sheet missing required columns: {missing_form_cols}. Available columns: {list(forms_df.columns)}. Required columns: {self.REQUIRED_FORMS_COLUMNS}")
            except Exception as e:
                raise Exception(f"Forms sheet column validation failed: {str(e)}")

            try:
                missing_question_cols = [col for col in self.REQUIRED_QUESTIONS_COLUMNS if col not in questions_df.columns]
                if missing_question_cols:
                    raise Exception(f"Questions Info sheet missing required columns: {missing_question_cols}. Available columns: {list(questions_df.columns)}. Required columns: {self.REQUIRED_QUESTIONS_COLUMNS}")
            except Exception as e:
                raise Exception(f"Questions Info sheet column validation failed: {str(e)}")

            try:
                missing_option_cols = [col for col in self.REQUIRED_OPTIONS_COLUMNS if col not in options_df.columns]
                if missing_option_cols:
                    raise Exception(f"Answer Options sheet missing required columns: {missing_option_cols}. Available columns: {list(options_df.columns)}. Required columns: {self.REQUIRED_OPTIONS_COLUMNS}")
            except Exception as e:
                raise Exception(f"Answer Options sheet column validation failed: {str(e)}")

            # Step 5: Parse form metadata with detailed error handling
            try:
                form_metadata = self._parse_form_metadata(forms_df)
                logger.info(f"Parsed form metadata: {form_metadata}")
            except Exception as e:
                raise Exception(f"Failed to parse form metadata from 'Forms' sheet: {str(e)}. Check that Language and Title columns have valid data.")
            
            # Step 6: Parse questions data with detailed error handling
            try:
                questions_data = self._parse_questions_data(questions_df)
                logger.info(f"Parsed {len(questions_data)} questions")
                if not questions_data:
                    raise Exception("No valid questions found. Check that the 'Questions Info' sheet has data with proper Order, Title, View Sequence, and Input Type values.")
            except Exception as e:
                raise Exception(f"Failed to parse questions from 'Questions Info' sheet: {str(e)}. Check data types: Order and View Sequence should be integers, Input Type should be a valid type (1-10).")

            # Step 7: Parse options data with detailed error handling
            try:
                options_data = self._parse_options_data(options_df)
                logger.info(f"Parsed {len(options_data)} options")
                if not options_data:
                    raise Exception("No valid options found. Check that the 'Answer Options' sheet has data with proper Order, Id, and Label values.")
            except Exception as e:
                raise Exception(f"Failed to parse options from 'Answer Options' sheet: {str(e)}. Check data types: Order and Id should be integers, Label should be text.")

            # Step 8: Build structured form schema
            try:
                form_title = self._get_form_title(forms_df)
                form_version = '1.0.0'
                groups = self._parse_questions(questions_df, options_df)
                logger.info(f"Built form schema with {len(groups)} groups")
            except Exception as e:
                raise Exception(f"Failed to build form schema: {str(e)}. This may be due to data inconsistencies between questions and options.")

            total_time = time.time() - start_all
            log_metric('parse_only_time', total_time)

            # Step 9: Construct response
            return {
                'id': None,  # No ID since not saved
                'title': form_title,
                'version': form_version,
                'language': form_metadata.get('language', 'en'),
                'groups': [group.dict() for group in groups],
                'settings': None,
                'metadata': {
                    'questions_count': len(questions_data),
                    'options_count': len(options_data),
                    'parse_time': total_time,
                    'created_at': form_metadata.get('created_at'),
                    'sheets_found': available_sheets,
                    'file_name': file.filename
                },
                'raw_data': {
                    'form_metadata': form_metadata,
                    'questions': questions_data,
                    'options': options_data
                }
            }

        except Exception as e:
            logger.error(f"Error parsing file {file.filename}: {str(e)}")
            raise  # Re-raise the exception with the detailed message
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
            if 'Language' in forms_df.columns:
                metadata['language'] = forms_df.iloc[0]['Language']
            if 'Title' in forms_df.columns:
                metadata['title'] = forms_df.iloc[0]['Title']

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

