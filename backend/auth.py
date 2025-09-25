from fastapi import Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import os
import re
import secrets
import aiohttp
from motor.motor_asyncio import AsyncIOMotorDatabase

# Environment setup
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=64)
    name: str = Field(..., min_length=1, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr  
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    is_active: bool = True
    provider: str = "email"  # email, google, apple, facebook, microsoft

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class SessionData(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

# Password validation
def validate_password(password: str) -> bool:
    """Validate password requirements: 8-64 characters"""
    if len(password) < 8 or len(password) > 64:
        return False
    return True

# Password hashing functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# User database operations
async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[dict]:
    return await db.users.find_one({"email": email})

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[dict]:
    return await db.users.find_one({"id": user_id})

async def create_user(db: AsyncIOMotorDatabase, user_data: dict) -> dict:
    user_data["created_at"] = datetime.now(timezone.utc)
    user_data["is_active"] = True
    await db.users.insert_one(user_data)
    return user_data

async def create_session(db: AsyncIOMotorDatabase, user_id: str, session_token: str):
    session_data = {
        "user_id": user_id,
        "session_token": session_token,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    }
    await db.sessions.insert_one(session_data)
    return session_data

async def get_session(db: AsyncIOMotorDatabase, session_token: str) -> Optional[dict]:
    session = await db.sessions.find_one({
        "session_token": session_token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    return session

async def delete_session(db: AsyncIOMotorDatabase, session_token: str):
    await db.sessions.delete_one({"session_token": session_token})

# Authentication dependency
async def get_current_user(
    request: Request,
    db: AsyncIOMotorDatabase,
    token: Optional[str] = Depends(oauth2_scheme),
    session_token: Optional[str] = Cookie(None)
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try session token from cookie first (preferred for web)
    if session_token:
        session = await get_session(db, session_token)
        if session:
            user = await get_user_by_id(db, session["user_id"])
            if user:
                return user
    
    # Try JWT token from Authorization header (fallback for mobile)
    if token:
        payload = verify_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                user = await get_user_by_id(db, user_id)
                if user:
                    return user
    
    raise credentials_exception

# OAuth session data processing
async def process_emergent_session(session_id: str) -> Optional[SessionData]:
    """Process session ID from Emergent auth to get user data"""
    try:
        async with aiohttp.ClientSession() as session:
            headers = {"X-Session-ID": session_id}
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return SessionData(**data)
                return None
    except Exception as e:
        print(f"Error processing Emergent session: {e}")
        return None