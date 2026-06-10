from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi
import logging
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

logger = logging.getLogger(__name__)

# Allow either a full connection string via MONGODB_URL or build it from
# individual parts (MONGODB_USER, MONGODB_PASSWORD, MONGODB_HOST). This lets
# you store the password as a separate secret in Render instead of a long URL.
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "mform_bulk_upload")

if not MONGODB_URL:
    user = os.getenv("MONGODB_USER", "")
    password = os.getenv("MONGODB_PASSWORD", "")
    host = os.getenv("MONGODB_HOST", "localhost:27017")

    if user or password:
        password_enc = quote_plus(password)
        if host and "." in host:
            MONGODB_URL = f"mongodb+srv://{user}:{password_enc}@{host}/{DATABASE_NAME}?retryWrites=true&w=majority"
        else:
            MONGODB_URL = f"mongodb://{user}:{password_enc}@{host}/{DATABASE_NAME}"
    else:
        MONGODB_URL = f"mongodb://{host}/{DATABASE_NAME}"

async_client = AsyncIOMotorClient(MONGODB_URL, tlsCAFile=certifi.where())
database = async_client[DATABASE_NAME]

forms_collection = database.forms
questions_collection = database.questions
options_collection = database.options


async def connect_to_mongo() -> None:
    """Connect to MongoDB."""
    try:
        await async_client.admin.command("ping")
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error("Failed to connect to MongoDB")
        raise e


async def close_mongo_connection() -> None:
    """Close MongoDB connection."""
    async_client.close()
