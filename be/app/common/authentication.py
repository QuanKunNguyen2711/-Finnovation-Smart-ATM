from typing import List
from fastapi import HTTPException, status
from functools import wraps
from app.common.db_collections import Collections
from app.common.db_connector import client
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

def protected_route():
    def auth_required(func):
        @wraps(func)
        async def wrapper(**kwargs):
            token = kwargs.get("CREDENTIALS").credentials
            current_user = await get_user_by_token(token, {"created_at": 0})
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid System Role!",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            kwargs["CURRENT_USER"] = current_user
            
            return await func(**kwargs)
        return wrapper
    return auth_required


async def get_user_by_token(access_token: str, projection: dict = {}) -> dict:
    payload = jwt.decode(access_token, os.environ.get("SECRET_SALT"), algorithms=[os.environ.get("JWT_ALGORITHM")])
    user_id = payload.get("_id")
    db = client.get_database(os.environ.get("DB"))
    col = db.get_collection(Collections.CUSTOMERS)
    user = await col.find_one({"_id": user_id, "active": True}, projection)
    return user