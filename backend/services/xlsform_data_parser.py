import pandas as pd
from typing import Dict, List, Any
from models.form import FormGroup, Question
import logging

logger = logging.getLogger(__name__)


class XLSFormDataParser:
    """Pure DataFrame -> dict transformation, no I/O, no async."""

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
        group = FormGroup(name='default', label={'default': 'Default Group'}, questions=[])
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
                {'name': str(choice['Id']), 'label': {'default': choice['Label']}}
                for _, choice in matching_choices.iterrows()
            ]
        return Question(**question_data)
