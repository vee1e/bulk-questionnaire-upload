from typing import List, Dict, Any, Optional
from bson import ObjectId
from database import forms_collection, questions_collection, options_collection
import logging

logger = logging.getLogger(__name__)

class DatabaseService:

    async def save_form(self, form_data: Dict[str, Any]) -> str:
        """Save form metadata to database"""
        try:
            if 'id' in form_data:
                del form_data['id']

            form_data['_id'] = ObjectId()

            result = await forms_collection.insert_one(form_data)
            logger.info(f"Form saved with ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving form: {e}")
            raise e

    async def save_questions(self, questions: List[Dict[str, Any]], form_id: str) -> List[str]:
        """Save questions to database"""
        try:
            question_ids = []
            for question in questions:
                question['form_id'] = form_id
                question['_id'] = ObjectId()

                result = await questions_collection.insert_one(question)
                question_ids.append(str(result.inserted_id))

            logger.info(f"Saved {len(questions)} questions for form {form_id}")
            return question_ids
        except Exception as e:
            logger.error(f"Error saving questions: {e}")
            raise e

    async def save_options(self, options: List[Dict[str, Any]], form_id: str) -> List[str]:
        """Save answer options to database"""
        try:
            option_ids = []
            for option in options:
                option['form_id'] = form_id
                option['_id'] = ObjectId()

                result = await options_collection.insert_one(option)
                option_ids.append(str(result.inserted_id))

            logger.info(f"Saved {len(options)} options for form {form_id}")
            return option_ids
        except Exception as e:
            logger.error(f"Error saving options: {e}")
            raise e

    async def get_form_by_id(self, form_id: str) -> Optional[Dict[str, Any]]:
        """Get form by ID"""
        try:
            form = await forms_collection.find_one({"_id": ObjectId(form_id)})
            if form:
                form['id'] = str(form['_id'])
                del form['_id']
            return form
        except Exception as e:
            logger.error(f"Error getting form: {e}")
            return None

    async def get_questions_by_form_id(self, form_id: str) -> List[Dict[str, Any]]:
        """Get all questions for a form"""
        try:
            questions = await questions_collection.find({"form_id": form_id}).to_list(length=10000)
            for question in questions:
                question['id'] = str(question['_id'])
                del question['_id']
            return questions
        except Exception as e:
            logger.error(f"Error getting questions: {e}")
            return []

    async def get_options_by_form_id(self, form_id: str) -> List[Dict[str, Any]]:
        """Get all options for a form"""
        try:
            options = await options_collection.find({"form_id": form_id}).to_list(length=10000)
            for option in options:
                option['id'] = str(option['_id'])
                del option['_id']
            return options
        except Exception as e:
            logger.error(f"Error getting options: {e}")
            return []

    async def get_all_forms(self) -> List[Dict[str, Any]]:
        """Get all forms, sorted by created_at descending"""
        try:
            forms = await forms_collection.find().sort("created_at", -1).to_list(length=10000)
            for form in forms:
                form['id'] = str(form['_id'])
                del form['_id']
            return forms
        except Exception as e:
            logger.error(f"Error getting all forms: {e}")
            return []

    async def delete_form(self, form_id: str) -> bool:
        """Delete form and all related data"""
        try:
            form_result = await forms_collection.delete_one({"_id": ObjectId(form_id)})

            questions_result = await questions_collection.delete_many({"form_id": form_id})

            options_result = await options_collection.delete_many({"form_id": form_id})

            logger.info(f"Deleted form {form_id} with {questions_result.deleted_count} questions and {options_result.deleted_count} options")
            return form_result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting form: {e}")
            return False

    async def delete_all_forms(self) -> bool:
        """Delete all forms and all related data"""
        try:
            forms_result = await forms_collection.delete_many({})
            questions_result = await questions_collection.delete_many({})
            options_result = await options_collection.delete_many({})
            logger.info(f"Deleted all forms ({forms_result.deleted_count}), questions ({questions_result.deleted_count}), and options ({options_result.deleted_count})")
            return True
        except Exception as e:
            logger.error(f"Error deleting all forms: {e}")
            return False

    async def update_form(self, form_id: str, form_data: Dict[str, Any], questions: List[Dict[str, Any]], options: List[Dict[str, Any]]) -> bool:
        """Update form metadata, questions, and options by form_id"""
        try:
            # Update form metadata
            if 'id' in form_data:
                del form_data['id']
            await forms_collection.update_one({"_id": ObjectId(form_id)}, {"$set": form_data})

            # Delete old questions and options
            await questions_collection.delete_many({"form_id": form_id})
            await options_collection.delete_many({"form_id": form_id})

            # Insert new questions
            for question in questions:
                question['form_id'] = form_id
                question['_id'] = ObjectId()
                await questions_collection.insert_one(question)

            # Insert new options
            for option in options:
                option['form_id'] = form_id
                option['_id'] = ObjectId()
                await options_collection.insert_one(option)

            logger.info(f"Updated form {form_id} with new metadata, questions, and options")
            return True
        except Exception as e:
            logger.error(f"Error updating form: {e}")
            return False
