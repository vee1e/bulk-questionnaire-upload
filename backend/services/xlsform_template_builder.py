import uuid
import secrets
from datetime import datetime, timezone
import pandas as pd
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class XLSFormTemplateBuilder:
    """JSON schema assembly for the tempData.json format."""

    def _generate_object_id(self) -> str:
        """Generate a mock ObjectId string for the tempData format."""
        return secrets.token_hex(12)

    def _extract_form_config(self, forms_df: pd.DataFrame) -> Dict[str, Any]:
        """Extract form configuration from Forms sheet with sensible defaults"""
        config = {
            'title': 'Untitled Form', 'language': 'en', 'version': '1',
            'projectOrder': 0, 'villageOrder': 5, 'blockOrder': 3, 'districtOrder': 2,
            'gramPanchayatOrder': 4, 'hamletOrder': 0,
            'hasCensus': False, 'isActive': True, 'isBulkUploadDraft': False,
            'isBulkUploadResponse': True, 'isCustomLabel': True, 'isDashboardDisable': False,
            'isDraftDisable': False, 'isDynamicCard': False, 'isLivelihood': True,
            'isMaster': False, 'isMedia': False, 'isOnline': False,
            'isResourceRepository': False, 'isViewOnly': False, 'isVisibleToAll': False,
            'isPreviewEnabled': True, 'hideAllLabel': False, 'allowPreviewDownload': False,
            'parallelImportCall': True, 'errorManagementStatus': True, 'dataMigrated': False,
            'enableAsr': False, 'enableTts': False, 'isAutoCalculate': False,
            'isReferenceData': False, 'isResetForReviewEdit': False, 'offlineReviewEdit': False,
            'mainFormId': None, 'filterFormId': None, 'copiedFormId': 125,
            'filterDataBy': ['GEOGRAPHY'], 'tags': []
        }
        if not forms_df.empty:
            first_row = forms_df.iloc[0]
            if 'Title' in forms_df.columns and pd.notna(first_row['Title']):
                config['title'] = str(first_row['Title']).strip()
            if 'Language' in forms_df.columns and pd.notna(first_row['Language']):
                config['language'] = str(first_row['Language']).strip().lower()
            if 'Version' in forms_df.columns and pd.notna(first_row['Version']):
                config['version'] = str(first_row['Version']).strip()
            order_mappings = {
                'Project Order': 'projectOrder', 'Village Order': 'villageOrder',
                'Block Order': 'blockOrder', 'District Order': 'districtOrder',
                'Gram Panchayat Order': 'gramPanchayatOrder', 'Hamlet Order': 'hamletOrder'
            }
            for excel_col, config_key in order_mappings.items():
                if excel_col in forms_df.columns and pd.notna(first_row[excel_col]):
                    try:
                        config[config_key] = int(first_row[excel_col])
                    except (ValueError, TypeError):
                        pass
            boolean_mappings = {
                'Has Census': 'hasCensus', 'Is Active': 'isActive',
                'Is Bulk Upload Draft': 'isBulkUploadDraft', 'Is Bulk Upload Response': 'isBulkUploadResponse',
                'Is Custom Label': 'isCustomLabel', 'Is Dashboard Disable': 'isDashboardDisable',
                'Is Draft Disable': 'isDraftDisable', 'Is Dynamic Card': 'isDynamicCard',
                'Is Livelihood': 'isLivelihood', 'Is Master': 'isMaster', 'Is Media': 'isMedia',
                'Is Online': 'isOnline', 'Is Resource Repository': 'isResourceRepository',
                'Is View Only': 'isViewOnly', 'Is Visible To All': 'isVisibleToAll',
                'Is Preview Enabled': 'isPreviewEnabled', 'Hide All Label': 'hideAllLabel',
                'Allow Preview Download': 'allowPreviewDownload', 'Parallel Import Call': 'parallelImportCall',
                'Error Management Status': 'errorManagementStatus', 'Data Migrated': 'dataMigrated',
                'Enable Asr': 'enableAsr', 'Enable Tts': 'enableTts',
                'Is Auto Calculate': 'isAutoCalculate', 'Is Reference Data': 'isReferenceData',
                'Is Reset For Review Edit': 'isResetForReviewEdit', 'Offline Review Edit': 'offlineReviewEdit'
            }
            for excel_col, config_key in boolean_mappings.items():
                if excel_col in forms_df.columns and pd.notna(first_row[excel_col]):
                    value = str(first_row[excel_col]).strip().lower()
                    if value in ['true', '1', 'yes', 'y']:
                        config[config_key] = True
                    elif value in ['false', '0', 'no', 'n']:
                        config[config_key] = False
            reference_mappings = {'Main Form Id': 'mainFormId', 'Filter Form Id': 'filterFormId', 'Copied Form Id': 'copiedFormId'}
            for excel_col, config_key in reference_mappings.items():
                if excel_col in forms_df.columns and pd.notna(first_row[excel_col]):
                    try:
                        value = first_row[excel_col]
                        if pd.notna(value) and str(value).strip():
                            config[config_key] = int(value) if str(value).isdigit() else str(value).strip()
                    except (ValueError, TypeError):
                        pass
            if 'Filter Data By' in forms_df.columns and pd.notna(first_row['Filter Data By']):
                filter_by_str = str(first_row['Filter Data By']).strip()
                if filter_by_str:
                    config['filterDataBy'] = [item.strip().upper() for item in filter_by_str.split(',')]
            if 'Tags' in forms_df.columns and pd.notna(first_row['Tags']):
                tags_str = str(first_row['Tags']).strip()
                if tags_str:
                    config['tags'] = [item.strip() for item in tags_str.split(',')]
        return config

    def _extract_db_form_config(self, form: Dict[str, Any]) -> Dict[str, Any]:
        """Extract form configuration from database form data with sensible defaults"""
        return {
            'title': form.get('title', 'Untitled Form'),
            'language': form.get('language', 'en'),
            'version': str(form.get('version', '1')),
            'projectOrder': 0, 'villageOrder': 5, 'blockOrder': 3, 'districtOrder': 2,
            'gramPanchayatOrder': 4, 'hamletOrder': 0,
            'hasCensus': False, 'isActive': True, 'isBulkUploadDraft': False,
            'isBulkUploadResponse': True, 'isCustomLabel': True, 'isDashboardDisable': False,
            'isDraftDisable': False, 'isDynamicCard': False, 'isLivelihood': True,
            'isMaster': False, 'isMedia': False, 'isOnline': False,
            'isResourceRepository': False, 'isViewOnly': False, 'isVisibleToAll': False,
            'isPreviewEnabled': True, 'hideAllLabel': False, 'allowPreviewDownload': False,
            'parallelImportCall': True, 'errorManagementStatus': True, 'dataMigrated': False,
            'enableAsr': False, 'enableTts': False, 'isAutoCalculate': False,
            'isReferenceData': False, 'isResetForReviewEdit': False, 'offlineReviewEdit': False,
            'mainFormId': None, 'filterFormId': None, 'copiedFormId': 125,
            'filterDataBy': ['GEOGRAPHY'], 'tags': []
        }

    def _build_temp_data_format(self, forms_df: pd.DataFrame, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[Dict[str, Any]]:
        config = self._extract_form_config(forms_df)
        now = datetime.now(timezone.utc).isoformat()
        form_definition = {
            "_id": f'ObjectId("{self._generate_object_id()}")',
            "formUiniqueId": f'ObjectId("{self._generate_object_id()}")',
            "formId": 848,
            "parentResponseId": None, "groupResponseId": None,
            "transactionId": str(uuid.uuid4()), "forParentValue": None,
            "uniqueId": f"generated_form_{int(datetime.now().timestamp())}",
            "userId": f'ObjectId("{self._generate_object_id()}")',
            "partner": f'ObjectId("{self._generate_object_id()}")',
            "project": f'ObjectId("{self._generate_object_id()}")',
            "loginId": f'ObjectId("{self._generate_object_id()}")',
            "hamlet": None,
            "village": f'ObjectId("{self._generate_object_id()}")',
            "gramPanchayat": f'ObjectId("{self._generate_object_id()}")',
            "block": f'ObjectId("{self._generate_object_id()}")',
            "district": f'ObjectId("{self._generate_object_id()}")',
            "state": f'ObjectId("{self._generate_object_id()}")',
            "location": {"lat": "0.0", "lng": "0.0", "accuracy": "0.0"},
            "backgroundVoice": None,
            "question": self._build_response_questions(questions_df, options_df),
            "responseUpdateHistory": [], "appVersion": "2.5.3", "responseIds": [],
            "mobileCreatedAt": f'ISODate("{now}")',
            "createdAt": f'ISODate("{now}")',
            "updatedAt": f'ISODate("{now}")',
            "blockOrder": config['blockOrder'], "districtOrder": config['districtOrder'],
            "gramPanchayatOrder": config['gramPanchayatOrder'], "hamletOrder": config['hamletOrder'],
            "hasCensus": config['hasCensus'], "hooks": [], "isActive": config['isActive'],
            "isBulkUploadDraft": config['isBulkUploadDraft'], "isBulkUploadResponse": config['isBulkUploadResponse'],
            "isCustomLabel": config['isCustomLabel'], "isDashboardDisable": config['isDashboardDisable'],
            "isDraftDisable": config['isDraftDisable'], "isDynamicCard": config['isDynamicCard'],
            "isLivelihood": config['isLivelihood'], "isMaster": config['isMaster'],
            "isMedia": config['isMedia'], "isOnline": config['isOnline'],
            "isResourceRepository": config['isResourceRepository'], "isViewOnly": config['isViewOnly'],
            "isVisibleToAll": config['isVisibleToAll'],
            "keyInfoOrders": self._get_key_info_orders(questions_df),
            "language": [{"lng": config['language'], "title": config['title'], "buttons": [], "question": self._build_form_questions(questions_df, options_df)}],
            "syncStatus": {"groupBy": "5", "filterBy": config['filterDataBy'], "conditions": [], "questions": self._build_sync_questions(questions_df), "_id": f'ObjectId("{self._generate_object_id()}")'},
            "version": config['version'], "villageOrder": config['villageOrder'],
            "googleSheet": {}, "actions": [], "isPreviewEnabled": config['isPreviewEnabled'],
            "projects": [], "hideAllLabel": config['hideAllLabel'],
            "mainFormId": config['mainFormId'], "projectOrder": config['projectOrder'],
            "filterDataBy": config['filterDataBy'], "filterFormId": config['filterFormId'],
            "maskingConfig": [], "encryptedQuestions": [],
            "allowPreviewDownload": config['allowPreviewDownload'],
            "parallelImportCall": config['parallelImportCall'],
            "errorManagementStatus": config['errorManagementStatus'],
            "searchOrders": [], "copiedFormId": config['copiedFormId'],
            "dataMigrated": config['dataMigrated'], "enableAsr": config['enableAsr'],
            "enableTts": config['enableTts'], "isAutoCalculate": config['isAutoCalculate'],
            "isReferenceData": config['isReferenceData'],
            "isResetForReviewEdit": config['isResetForReviewEdit'],
            "metaDataConfig": [], "offlineReviewEdit": config['offlineReviewEdit'],
            "tags": config['tags']
        }
        return [form_definition]

    def _build_response_questions(self, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[Dict[str, Any]]:
        questions = []
        for _, row in questions_df.iterrows():
            order = str(row['Order'])
            input_type = str(row['Input Type'])
            matching_options = options_df[options_df['Order'] == int(order)]
            answer_data = []
            initial_answer_data = []
            if not matching_options.empty:
                first_option = matching_options.iloc[0]
                answer_data = [{"value": str(first_option['Id']), "label": str(first_option['Label']), "_id": f'ObjectId("{self._generate_object_id()}")'}]
                initial_answer_data = [{"value": str(first_option['Id']), "label": str(first_option['Label']), "_id": f'ObjectId("{self._generate_object_id()}")'}]
            questions.append({"order": order, "input_type": input_type, "answer": answer_data, "intialAnswer": initial_answer_data, "history": [], "nestedAnswer": [], "_id": f'ObjectId("{self._generate_object_id()}")'})
        return questions

    def _build_form_questions(self, questions_df: pd.DataFrame, options_df: pd.DataFrame) -> List[Dict[str, Any]]:
        questions = []
        for _, row in questions_df.iterrows():
            order = str(row['Order'])
            input_type = str(row['Input Type'])
            title = str(row['Title'])
            view_sequence = str(row.get('View Sequence', order))
            matching_options = options_df[options_df['Order'] == int(order)]
            answer_options = []
            if not matching_options.empty:
                for _, option_row in matching_options.iterrows():
                    answer_options.append({"_id": str(option_row['Id']), "name": str(option_row['Label']), "shortKey": "", "visibility": None, "did": [], "viewSequence": str(option_row['Id']), "coordinates": []})
            questions.append({"order": order, "label": order, "title": title, "shortKey": f"question_{order}", "information": "", "viewSequence": view_sequence, "input_type": input_type, "validation": [{"_id": "1", "error_msg": "", "condition": None}], "answer_option": answer_options, "restrictions": [], "child": [], "parent": [], "hint": "", "error_msg": "", "resource_urls": [], "editable": False, "weightage": [], "_id": f'ObjectId("{self._generate_object_id()}")'})
        return questions

    def _build_sync_questions(self, questions_df: pd.DataFrame) -> List[Dict[str, Any]]:
        sync_questions = []
        for _, row in questions_df.iterrows():
            order = str(row['Order'])
            sync_questions.append({"order": order, "key": f"order{order}", "clear": False, "edit": True, "setDefault": None, "_id": f'ObjectId("{self._generate_object_id()}")'})
        return sync_questions

    def _get_key_info_orders(self, questions_df: pd.DataFrame) -> List[str]:
        orders = []
        for _, row in questions_df.iterrows():
            orders.append(str(row['Order']))
            if len(orders) >= 7:
                break
        return orders

    def _convert_db_to_temp_data_format(self, form: Dict[str, Any], questions: List[Dict[str, Any]], options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        config = self._extract_db_form_config(form)
        now = datetime.now(timezone.utc).isoformat()
        form_definition = {
            "_id": f'ObjectId("{self._generate_object_id()}")',
            "formUiniqueId": f'ObjectId("{form.get("id", self._generate_object_id())}")',
            "formId": 848,
            "parentResponseId": None, "groupResponseId": None,
            "transactionId": str(uuid.uuid4()), "forParentValue": None,
            "uniqueId": f"db_form_{form.get('id', 'unknown')}_{int(datetime.now().timestamp())}",
            "userId": f'ObjectId("{self._generate_object_id()}")',
            "partner": f'ObjectId("{self._generate_object_id()}")',
            "project": f'ObjectId("{self._generate_object_id()}")',
            "loginId": f'ObjectId("{self._generate_object_id()}")',
            "hamlet": None,
            "village": f'ObjectId("{self._generate_object_id()}")',
            "gramPanchayat": f'ObjectId("{self._generate_object_id()}")',
            "block": f'ObjectId("{self._generate_object_id()}")',
            "district": f'ObjectId("{self._generate_object_id()}")',
            "state": f'ObjectId("{self._generate_object_id()}")',
            "location": {"lat": "0.0", "lng": "0.0", "accuracy": "0.0"},
            "backgroundVoice": None,
            "question": self._build_response_questions_from_db(questions, options),
            "responseUpdateHistory": [], "appVersion": "2.5.3", "responseIds": [],
            "mobileCreatedAt": f'ISODate("{form.get("created_at", now)}")',
            "createdAt": f'ISODate("{form.get("created_at", now)}")',
            "updatedAt": f'ISODate("{now}")',
            "blockOrder": config['blockOrder'], "districtOrder": config['districtOrder'],
            "gramPanchayatOrder": config['gramPanchayatOrder'], "hamletOrder": config['hamletOrder'],
            "hasCensus": config['hasCensus'], "hooks": [], "isActive": config['isActive'],
            "isBulkUploadDraft": config['isBulkUploadDraft'], "isBulkUploadResponse": config['isBulkUploadResponse'],
            "isCustomLabel": config['isCustomLabel'], "isDashboardDisable": config['isDashboardDisable'],
            "isDraftDisable": config['isDraftDisable'], "isDynamicCard": config['isDynamicCard'],
            "isLivelihood": config['isLivelihood'], "isMaster": config['isMaster'],
            "isMedia": config['isMedia'], "isOnline": config['isOnline'],
            "isResourceRepository": config['isResourceRepository'], "isViewOnly": config['isViewOnly'],
            "isVisibleToAll": config['isVisibleToAll'],
            "keyInfoOrders": self._get_key_info_orders_from_db(questions),
            "language": [{"lng": config['language'], "title": config['title'], "buttons": [], "question": self._build_form_questions_from_db(questions, options)}],
            "syncStatus": {"groupBy": "5", "filterBy": config['filterDataBy'], "conditions": [], "questions": self._build_sync_questions_from_db(questions), "_id": f'ObjectId("{self._generate_object_id()}")'},
            "version": config['version'], "villageOrder": config['villageOrder'],
            "googleSheet": {}, "actions": [], "isPreviewEnabled": config['isPreviewEnabled'],
            "projects": [], "hideAllLabel": config['hideAllLabel'],
            "mainFormId": config['mainFormId'], "projectOrder": config['projectOrder'],
            "filterDataBy": config['filterDataBy'], "filterFormId": config['filterFormId'],
            "maskingConfig": [], "encryptedQuestions": [],
            "allowPreviewDownload": config['allowPreviewDownload'],
            "parallelImportCall": config['parallelImportCall'],
            "errorManagementStatus": config['errorManagementStatus'],
            "searchOrders": [], "copiedFormId": config['copiedFormId'],
            "dataMigrated": config['dataMigrated'], "enableAsr": config['enableAsr'],
            "enableTts": config['enableTts'], "isAutoCalculate": config['isAutoCalculate'],
            "isReferenceData": config['isReferenceData'],
            "isResetForReviewEdit": config['isResetForReviewEdit'],
            "metaDataConfig": [], "offlineReviewEdit": config['offlineReviewEdit'],
            "tags": config['tags']
        }
        return [form_definition]

    def _build_response_questions_from_db(self, questions: List[Dict[str, Any]], options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        response_questions = []
        for question in questions:
            order = str(question['order'])
            input_type = str(question['input_type'])
            matching_options = [opt for opt in options if opt['order'] == question['order']]
            answer_data = []
            initial_answer_data = []
            if matching_options:
                first_option = matching_options[0]
                answer_data = [{"value": str(first_option['option_id']), "label": str(first_option['label']), "_id": f'ObjectId("{self._generate_object_id()}")'}]
                initial_answer_data = [{"value": str(first_option['option_id']), "label": str(first_option['label']), "_id": f'ObjectId("{self._generate_object_id()}")'}]
            response_questions.append({"order": order, "input_type": input_type, "answer": answer_data, "intialAnswer": initial_answer_data, "history": [], "nestedAnswer": [], "_id": f'ObjectId("{self._generate_object_id()}")'})
        return response_questions

    def _build_form_questions_from_db(self, questions: List[Dict[str, Any]], options: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        form_questions = []
        for question in questions:
            order = str(question['order'])
            input_type = str(question['input_type'])
            title = str(question['title'])
            view_sequence = str(question.get('view_sequence', question['order']))
            matching_options = [opt for opt in options if opt['order'] == question['order']]
            answer_options = []
            for option in matching_options:
                answer_options.append({"_id": str(option['option_id']), "name": str(option['label']), "shortKey": "", "visibility": None, "did": [], "viewSequence": str(option['option_id']), "coordinates": []})
            form_questions.append({"order": order, "label": order, "title": title, "shortKey": f"question_{order}", "information": "", "viewSequence": view_sequence, "input_type": input_type, "validation": [{"_id": "1", "error_msg": "", "condition": None}], "answer_option": answer_options, "restrictions": [], "child": [], "parent": [], "hint": "", "error_msg": "", "resource_urls": [], "editable": False, "weightage": [], "_id": f'ObjectId("{self._generate_object_id()}")'})
        return form_questions

    def _build_sync_questions_from_db(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sync_questions = []
        for question in questions:
            order = str(question['order'])
            sync_questions.append({"order": order, "key": f"order{order}", "clear": False, "edit": True, "setDefault": None, "_id": f'ObjectId("{self._generate_object_id()}")'})
        return sync_questions

    def _get_key_info_orders_from_db(self, questions: List[Dict[str, Any]]) -> List[str]:
        orders = []
        for question in questions:
            orders.append(str(question['order']))
            if len(orders) >= 7:
                break
        return orders
