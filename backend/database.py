from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "mform_bulk_upload")

async_client = AsyncIOMotorClient(MONGODB_URL)
database = async_client[DATABASE_NAME]

forms_collection = database.forms
questions_collection = database.questions
options_collection = database.options

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        await async_client.admin.command('ping')
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close MongoDB connection"""
    async_client.close() 