import pandas as pd
from fastapi import UploadFile
from typing import Dict, List, Any, Optional
import uuid
from models.form import ParsedForm, FormGroup, Question
import logging

logger = logging.getLogger(__name__)

class XLSFormParser:
    REQUIRED_SHEETS = ['Forms', 'Questions Info', 'Answer Options']
    REQUIRED_FORMS_COLUMNS = ['Language', 'Title']
    REQUIRED_QUESTIONS_COLUMNS = ['Order', 'Title', 'View Sequence', 'Input Type']
    REQUIRED_OPTIONS_COLUMNS = ['Order', 'Id', 'Label']

    async def validate_file(self, file: UploadFile) -> Dict[str, Any]:
        try:
            df_dict = pd.read_excel(file.file, sheet_name=None)
            
            sheets_validation = []
            form_metadata = {}
            questions_count = 0
            options_count = 0
            
            # Validate Forms sheet
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
            
            # Validate Questions Info sheet
            questions_validation = self._validate_sheet(
                df_dict, 'Questions Info', self.REQUIRED_QUESTIONS_COLUMNS
            )
            sheets_validation.append(questions_validation)
            
            if questions_validation['exists'] and not questions_validation['missing_columns']:
                questions_df = df_dict['Questions Info']
                questions_count = len(questions_df)
            
            # Validate Answer Options sheet
            options_validation = self._validate_sheet(
                df_dict, 'Answer Options', self.REQUIRED_OPTIONS_COLUMNS
            )
            sheets_validation.append(options_validation)
            
            if options_validation['exists'] and not options_validation['missing_columns']:
                options_df = df_dict['Answer Options']
                options_count = len(options_df)
            
            # Overall validation
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

            form_id = str(uuid.uuid4())
            form_title = self._get_form_title(forms_df)
            form_version = '1.0.0'

            groups = self._parse_questions(questions_df, options_df)

            return ParsedForm(
                id=form_id,
                title=form_title,
                version=form_version,
                groups=groups,
                settings=None
            )

        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
            raise
        finally:
            await file.seek(0)

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

