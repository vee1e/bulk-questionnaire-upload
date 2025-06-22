import pandas as pd
from fastapi import UploadFile
from typing import Dict, List, Any, Optional
import uuid
from models.form import ParsedForm, FormGroup, Question
from services.database_service import DatabaseService
import logging

logger = logging.getLogger(__name__)

class XLSFormParser:
    REQUIRED_SHEETS = ['Forms', 'Questions Info', 'Answer Options']
    REQUIRED_FORMS_COLUMNS = ['Language', 'Title']
    REQUIRED_QUESTIONS_COLUMNS = ['Order', 'Title', 'View Sequence', 'Input Type']
    REQUIRED_OPTIONS_COLUMNS = ['Order', 'Id', 'Label']

    def __init__(self):
        self.db_service = DatabaseService()

    async def validate_file(self, file: UploadFile) -> Dict[str, Any]:
        try:
            df_dict = pd.read_excel(file.file, sheet_name=None)
            
            sheets_validation = []
            form_metadata = {}
            questions_count = 0
            options_count = 0
            
            forms_validation = self._validate_sheet(
                df_dict, 'Forms', self.REQUIRED_FORMS_COLUMNS
            )
            sheets_validation.append(forms_validation)
            
            if forms_validation['exists'] and not forms_validation['missing_columns']:
                forms_df = df_dict['Forms']
                if not forms_df.empty:
                    form_metadata = {
                        'language': forms_df.iloc[0].get('Language', 'Unknown'),
                        'title': forms_df.iloc[0].get('Title', 'Untitled')
                    }
            
            questions_validation = self._validate_sheet(
                df_dict, 'Questions Info', self.REQUIRED_QUESTIONS_COLUMNS
            )
            sheets_validation.append(questions_validation)
            
            if questions_validation['exists'] and not questions_validation['missing_columns']:
                questions_df = df_dict['Questions Info']
                questions_count = len(questions_df)
            
            options_validation = self._validate_sheet(
                df_dict, 'Answer Options', self.REQUIRED_OPTIONS_COLUMNS
            )
            sheets_validation.append(options_validation)
            
            if options_validation['exists'] and not options_validation['missing_columns']:
                options_df = df_dict['Answer Options']
                options_count = len(options_df)
            
            is_valid = all(sheet['exists'] and not sheet['missing_columns'] for sheet in sheets_validation)
            
            return {
                'valid': is_valid,
                'message': "File format is valid." if is_valid else "Invalid XLSForm structure.",
                'sheets': sheets_validation,
                'form_metadata': form_metadata,
                'questions_count': questions_count,
                'options_count': options_count
            }

        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            return {
                'valid': False,
                'message': f"Error validating file: {str(e)}",
                'sheets': [],
                'form_metadata': {},
                'questions_count': 0,
                'options_count': 0
            }
        finally:
            await file.seek(0)

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
        try:
            df_dict = pd.read_excel(file.file, sheet_name=None)

            forms_df = df_dict['Forms']
            questions_df = df_dict['Questions Info']
            options_df = df_dict['Answer Options']

            form_metadata = self._parse_form_metadata(forms_df)
            
            form_id = await self.db_service.save_form(form_metadata)
            
            questions_data = self._parse_questions_data(questions_df)
            question_ids = await self.db_service.save_questions(questions_data, form_id)
            
            options_data = self._parse_options_data(options_df)
            option_ids = await self.db_service.save_options(options_data, form_id)

            form_title = self._get_form_title(forms_df)
            form_version = '1.0.0'
            groups = self._parse_questions(questions_df, options_df)

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
                    'saved_option_ids': option_ids
                }
            )

        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
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

