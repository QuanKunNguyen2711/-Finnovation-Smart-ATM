from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from app.common.authentication import get_user_by_token
import os
from dotenv import load_dotenv
import warnings
from concurrent.futures import ThreadPoolExecutor
import asyncio
import logging
import FaceDetection.endpoints
from bson import ObjectId


load_dotenv()

warnings.filterwarnings("ignore", category=FutureWarning, message="`resume_download` is deprecated and will be removed in version 1.0.0. Downloads always resume when possible. If you want to force a new download, use `force_download=True`")

logging.basicConfig(
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

app = FastAPI()

origins = [
    'http://localhost:3000',
    'http://localhost:8000',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/", include_in_schema=False)
def redirect_to_docs():
    return RedirectResponse(url=os.environ.get("DOCS_ROUTE"))

# Include Routers

app.include_router(FaceDetection.endpoints.router, prefix='/api', tags=["Face Detection"])