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

    async def validate_file(self, file: UploadFile) -> bool:
        try:
            df_dict = pd.read_excel(file.file, sheet_name=None)

            if not all(sheet in df_dict for sheet in self.REQUIRED_SHEETS):
                logger.error("Missing required sheets")
                return False

            forms_df = df_dict['Forms']
            if not all(col in forms_df.columns for col in self.REQUIRED_FORMS_COLUMNS):
                logger.error("Missing required columns in Forms sheet")
                return False

            questions_df = df_dict['Questions Info']
            if not all(col in questions_df.columns for col in self.REQUIRED_QUESTIONS_COLUMNS):
                logger.error("Missing required columns in Questions Info sheet")
                return False

            options_df = df_dict['Answer Options']
            if not all(col in options_df.columns for col in self.REQUIRED_OPTIONS_COLUMNS):
                logger.error("Missing required columns in Answer Options sheet")
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating file: {str(e)}")
            return False
        finally:
            await file.seek(0)

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

