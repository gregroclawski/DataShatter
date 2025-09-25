from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, status, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ValidationError
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import secrets
import aiohttp

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Authentication setup
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Create the main app without a prefix
app = FastAPI(title="Ninja Master Mobile API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Authentication Models
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
async def get_user_by_email(email: str) -> Optional[dict]:
    return await db.users.find_one({"email": email})

async def get_user_by_id(user_id: str) -> Optional[dict]:
    return await db.users.find_one({"id": user_id})

async def create_user(user_data: dict) -> dict:
    user_data["created_at"] = datetime.now(timezone.utc)
    user_data["is_active"] = True
    await db.users.insert_one(user_data)
    return user_data

async def create_session(user_id: str, session_token: str):
    session_data = {
        "user_id": user_id,
        "session_token": session_token,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    }
    await db.sessions.insert_one(session_data)
    return session_data

async def get_session(session_token: str) -> Optional[dict]:
    session = await db.sessions.find_one({
        "session_token": session_token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    return session

async def delete_session(session_token: str):
    await db.sessions.delete_one({"session_token": session_token})

# Authentication dependency
async def get_current_user(
    request: Request,
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
        session = await get_session(session_token)
        if session:
            user = await get_user_by_id(session["user_id"])
            if user:
                return user
    
    # Try JWT token from Authorization header (fallback for mobile)
    if token:
        payload = verify_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                user = await get_user_by_id(user_id)
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

# Game Models
class NinjaStats(BaseModel):
    level: int = 1
    experience: int = 0
    experienceToNext: int = 100
    health: int = 100
    maxHealth: int = 100
    energy: int = 50
    maxEnergy: int = 50
    attack: int = 10
    defense: int = 5
    speed: int = 8
    luck: int = 3
    gold: int = 100
    gems: int = 10
    skillPoints: int = 0

class Shuriken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rarity: str  # common, rare, epic, legendary
    attack: int
    level: int = 1
    equipped: bool = False

class Pet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    level: int = 1
    experience: int = 0
    happiness: int = 50
    strength: int = 10
    active: bool = False
    rarity: str = "common"

class GameSave(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    playerId: str
    ninja: NinjaStats
    shurikens: List[Shuriken] = []
    pets: List[Pet] = []
    lastSaveTime: datetime = Field(default_factory=datetime.utcnow)
    isAlive: bool = True
    achievements: List[str] = []
    unlockedFeatures: List[str] = ["stats", "shurikens"]

class SaveGameRequest(BaseModel):
    playerId: str
    ninja: NinjaStats
    shurikens: List[Shuriken] = []
    pets: List[Pet] = []
    achievements: List[str] = []
    unlockedFeatures: List[str] = []

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Ninja Master Mobile API"}

@api_router.post("/save-game", response_model=GameSave)
async def save_game(save_request: SaveGameRequest):
    """Save player's game progress"""
    try:
        # Check if save exists
        existing_save = await db.game_saves.find_one({"playerId": save_request.playerId})
        
        save_data = {
            "playerId": save_request.playerId,
            "ninja": save_request.ninja.dict(),
            "shurikens": [s.dict() for s in save_request.shurikens],
            "pets": [p.dict() for p in save_request.pets],
            "achievements": save_request.achievements,
            "unlockedFeatures": save_request.unlockedFeatures,
            "lastSaveTime": datetime.utcnow(),
            "isAlive": True
        }
        
        if existing_save:
            # Update existing save
            save_data["id"] = existing_save["id"]
            await db.game_saves.update_one(
                {"playerId": save_request.playerId},
                {"$set": save_data}
            )
        else:
            # Create new save
            save_data["id"] = str(uuid.uuid4())
            await db.game_saves.insert_one(save_data)
        
        return GameSave(**save_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save game: {str(e)}")

@api_router.get("/load-game/{player_id}", response_model=Optional[GameSave])
async def load_game(player_id: str):
    """Load player's game progress"""
    try:
        save_data = await db.game_saves.find_one({"playerId": player_id})
        if save_data:
            return GameSave(**save_data)
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load game: {str(e)}")

@api_router.get("/leaderboard")
async def get_leaderboard():
    """Get top players leaderboard"""
    try:
        pipeline = [
            {"$sort": {"ninja.level": -1, "ninja.experience": -1}},
            {"$limit": 10},
            {"$project": {
                "_id": 0,  # Exclude MongoDB ObjectId to avoid serialization issues
                "playerId": 1,
                "level": "$ninja.level",
                "experience": "$ninja.experience",
                "gold": "$ninja.gold",
                "lastSaveTime": 1
            }}
        ]
        
        leaderboard = await db.game_saves.aggregate(pipeline).to_list(10)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")

@api_router.post("/generate-shuriken")
async def generate_shuriken():
    """Generate a random shuriken"""
    import random
    
    rarities = ["common", "rare", "epic", "legendary"]
    rarity_weights = [50, 30, 15, 5]  # Probability weights
    
    rarity = random.choices(rarities, weights=rarity_weights)[0]
    
    # Base stats based on rarity
    base_stats = {
        "common": {"attack": random.randint(5, 15), "multiplier": 1.0},
        "rare": {"attack": random.randint(12, 25), "multiplier": 1.5},
        "epic": {"attack": random.randint(20, 40), "multiplier": 2.0},
        "legendary": {"attack": random.randint(35, 60), "multiplier": 3.0}
    }
    
    names = {
        "common": ["Training Shuriken", "Iron Shuriken", "Basic Blade"],
        "rare": ["Silver Star", "Wind Cutter", "Shadow Blade"],
        "epic": ["Dragon Fang", "Lightning Strike", "Void Piercer"],
        "legendary": ["Celestial Edge", "Demon Slayer", "God Killer"]
    }
    
    stats = base_stats[rarity]
    name = random.choice(names[rarity])
    
    shuriken = Shuriken(
        name=name,
        rarity=rarity,
        attack=stats["attack"],
        level=1,
        equipped=False
    )
    
    return {"shuriken": shuriken.dict()}

@api_router.post("/generate-pet")
async def generate_pet():
    """Generate a random pet"""
    import random
    
    pet_types = ["Dragon", "Wolf", "Eagle", "Tiger", "Phoenix", "Shadow Cat", "Spirit Fox"]
    rarities = ["common", "rare", "epic", "legendary"]
    rarity_weights = [45, 35, 15, 5]
    
    rarity = random.choices(rarities, weights=rarity_weights)[0]
    pet_type = random.choice(pet_types)
    
    base_stats = {
        "common": {"strength": random.randint(8, 15)},
        "rare": {"strength": random.randint(12, 25)},
        "epic": {"strength": random.randint(20, 35)},
        "legendary": {"strength": random.randint(30, 50)}
    }
    
    pet = Pet(
        name=f"{rarity.title()} {pet_type}",
        type=pet_type,
        level=1,
        experience=0,
        happiness=random.randint(40, 80),
        strength=base_stats[rarity]["strength"],
        active=False,
        rarity=rarity
    )
    
    return {"pet": pet.dict()}

@api_router.get("/game-events")
async def get_game_events():
    """Get current game events and special offers"""
    events = [
        {
            "id": "daily_reward",
            "title": "Daily Login Bonus",
            "description": "Get 50 gold and 5 gems for logging in daily!",
            "type": "daily",
            "rewards": {"gold": 50, "gems": 5},
            "active": True
        },
        {
            "id": "weekend_double_xp",
            "title": "Weekend XP Boost",
            "description": "Double experience from all activities!",
            "type": "weekend",
            "multiplier": 2.0,
            "active": False
        }
    ]
    
    return {"events": events}

# Include the router in the main app
app.include_router(api_router)

# Include authentication routes
auth_router = create_auth_router(db)
api_router.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()