from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
import ssl
import certifi
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

# Allow either a full connection string via MONGODB_URL or build it from
# individual parts (MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST). This lets
# you store the password as a separate secret in Render instead of a long URL.
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "mform_bulk_upload")

if not MONGODB_URL:
    user = os.getenv("MONGODB_USER", "vermalucky2004")
    password = os.getenv("MONGODB_PASSWORD", "")
    host = os.getenv("MONGODB_HOST", "localhost:27017")

    # URL-encode password in case it contains special characters
    password_enc = quote_plus(password)

    # If host looks like a mongodb+srv host (contains "."), use the srv URL
    if host and ("." in host):
        MONGODB_URL = f"mongodb+srv://{user}:{password_enc}@{host}/{DATABASE_NAME}?retryWrites=true&w=majority"
    else:
        MONGODB_URL = f"mongodb://{user}:{password_enc}@{host}/{DATABASE_NAME}"

_ssl_context = ssl.create_default_context(cafile=certifi.where())
_ssl_context.set_ciphers("DEFAULT@SECLEVEL=1")

async_client = AsyncIOMotorClient(MONGODB_URL, ssl_context=_ssl_context)
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
