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
from enum import Enum
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

# Subscription Models
class SubscriptionType(str, Enum):
    XP_DROP_BOOST = "xp_drop_boost"
    ZONE_PROGRESSION_BOOST = "zone_progression_boost"

class Subscription(BaseModel):
    id: str
    user_id: str
    subscription_type: SubscriptionType
    price: float
    duration_days: int
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    created_at: datetime

class PurchaseSubscriptionRequest(BaseModel):
    subscription_type: SubscriptionType
    payment_method: str = "demo"  # For demo purposes

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
class StatPool(BaseModel):
    attack: int = 0
    defense: int = 0
    speed: int = 0
    luck: int = 0
    maxHealth: int = 0
    maxEnergy: int = 0

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
    
    # Separate stat pools for upgrades
    baseStats: Optional[StatPool] = None
    goldUpgrades: Optional[StatPool] = None
    skillPointUpgrades: Optional[StatPool] = None

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
    zoneProgress: Optional[Dict[str, Any]] = {}
    equipment: Optional[Dict[str, Any]] = None  # Equipment and inventory data
    abilityData: Optional[Dict[str, Any]] = None  # Ability deck and progression data

class SaveGameRequest(BaseModel):
    playerId: str
    ninja: NinjaStats
    shurikens: List[Shuriken] = []
    pets: List[Pet] = []
    achievements: List[str] = []
    unlockedFeatures: List[str] = []
    zoneProgress: Optional[Dict[str, Any]] = {}
    equipment: Optional[Dict[str, Any]] = None  # Equipment and inventory data
    abilityData: Optional[Dict[str, Any]] = None  # Ability deck and progression data

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Ninja Master Mobile API"}

@api_router.post("/save-game", response_model=GameSave)
async def save_game(save_request: SaveGameRequest):
    """Save player's game progress"""
    try:
        print(f"💾 SAVE REQUEST - Player ID: {save_request.playerId}")
        print(f"💾 SAVE REQUEST - Ninja Level: {save_request.ninja.level}")
        print(f"💾 SAVE REQUEST - Ninja XP: {save_request.ninja.experience}")
        print(f"💾 SAVE REQUEST - Ninja Gold: {save_request.ninja.gold}")
        print(f"💾 SAVE REQUEST - Ninja Gems: {save_request.ninja.gems}")
        print(f"💾 SAVE REQUEST - Gold Upgrades: {getattr(save_request.ninja, 'goldUpgrades', None)}")  # Add gold upgrades logging
        print(f"💾 SAVE REQUEST - Skill Point Upgrades: {getattr(save_request.ninja, 'skillPointUpgrades', None)}")  # Add skill point upgrades logging
        print(f"💾 SAVE REQUEST - Zone Progress: {save_request.zoneProgress}")
        print(f"💾 SAVE REQUEST - Equipment: {save_request.equipment}")  # Add equipment logging
        print(f"💾 SAVE REQUEST - Ability Data: {save_request.abilityData}")  # Add ability data logging
        
        # Check if save exists
        existing_save = await db.game_saves.find_one({"playerId": save_request.playerId})
        print(f"💾 EXISTING SAVE FOUND: {existing_save is not None}")
        
        save_data = {
            "playerId": save_request.playerId,
            "ninja": save_request.ninja.dict(),
            "shurikens": [s.dict() for s in save_request.shurikens],
            "pets": [p.dict() for p in save_request.pets],
            "achievements": save_request.achievements,
            "unlockedFeatures": save_request.unlockedFeatures,
            "zoneProgress": save_request.zoneProgress or {},
            "equipment": save_request.equipment,  # Add equipment data to save
            "abilityData": save_request.abilityData,  # Add ability data to save
            "lastSaveTime": datetime.utcnow(),
            "isAlive": True
        }
        
        if existing_save:
            # Update existing save
            save_data["id"] = existing_save["id"]
            update_result = await db.game_saves.update_one(
                {"playerId": save_request.playerId},
                {"$set": save_data}
            )
            print(f"💾 UPDATE RESULT - Modified: {update_result.modified_count}")
        else:
            # Create new save
            save_data["id"] = str(uuid.uuid4())
            insert_result = await db.game_saves.insert_one(save_data)
            print(f"💾 INSERT RESULT - ID: {insert_result.inserted_id}")
        
        print(f"✅ SAVE COMPLETED - Player: {save_request.playerId}, Level: {save_request.ninja.level}")
        return GameSave(**save_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save game: {str(e)}")

@api_router.get("/load-game/{player_id}", response_model=Optional[GameSave])
async def load_game(player_id: str):
    """Load player's game progress"""
    try:
        print(f"📥 LOAD REQUEST - Player ID: {player_id}")
        save_data = await db.game_saves.find_one({"playerId": player_id})
        
        if save_data:
            print(f"📥 FOUND SAVE DATA for {player_id}:")
            print(f"   - Level: {save_data.get('ninja', {}).get('level', 'MISSING')}")
            print(f"   - XP: {save_data.get('ninja', {}).get('experience', 'MISSING')}")
            print(f"   - Gold: {save_data.get('ninja', {}).get('gold', 'MISSING')}")
            print(f"   - Gems: {save_data.get('ninja', {}).get('gems', 'MISSING')}")
            print(f"✅ LOAD COMPLETED - Returning saved data")
            return GameSave(**save_data)
        else:
            print(f"❌ NO SAVE FOUND for player {player_id} - returning None")
            return None
    except Exception as e:
        print(f"💥 LOAD ERROR for player {player_id}: {str(e)}")
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

# Subscription Routes
@api_router.post("/subscriptions/purchase")
async def purchase_subscription(
    subscription_request: PurchaseSubscriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Purchase a subscription"""
    try:
        user_id = current_user.get("id")
        
        # Check if user already has active subscription of this type
        existing_subscription = await db.subscriptions.find_one({
            "user_id": user_id,
            "subscription_type": subscription_request.subscription_type,
            "is_active": True,
            "end_date": {"$gt": datetime.now(timezone.utc)}
        })
        
        if existing_subscription:
            raise HTTPException(
                status_code=400, 
                detail="You already have an active subscription of this type"
            )
        
        # Create new subscription
        subscription_id = str(uuid.uuid4())
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=30)  # 30 days subscription
        
        subscription_data = {
            "id": subscription_id,
            "user_id": user_id,
            "subscription_type": subscription_request.subscription_type,
            "price": 40.0,  # $40 for both subscription types
            "duration_days": 30,
            "start_date": start_date,
            "end_date": end_date,
            "is_active": True,
            "created_at": start_date,
            "payment_method": subscription_request.payment_method
        }
        
        # Insert subscription into database
        await db.subscriptions.insert_one(subscription_data)
        
        print(f"💳 SUBSCRIPTION PURCHASED - User: {user_id}, Type: {subscription_request.subscription_type}")
        
        return {
            "success": True,
            "subscription": subscription_data,
            "message": f"Successfully purchased {subscription_request.subscription_type} subscription for 30 days!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Subscription purchase error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to purchase subscription: {str(e)}")

@api_router.get("/subscriptions/active")
async def get_active_subscriptions(current_user: dict = Depends(get_current_user)):
    """Get user's active subscriptions"""
    try:
        user_id = current_user.get("id")
        current_time = datetime.now(timezone.utc)
        
        # Find all active subscriptions for user
        active_subscriptions = []
        cursor = db.subscriptions.find({
            "user_id": user_id,
            "is_active": True,
            "end_date": {"$gt": current_time}
        })
        
        async for subscription in cursor:
            # Convert ObjectId to string for JSON serialization
            subscription["_id"] = str(subscription["_id"])
            active_subscriptions.append(subscription)
        
        print(f"📋 ACTIVE SUBSCRIPTIONS - User: {user_id}, Count: {len(active_subscriptions)}")
        
        return {"subscriptions": active_subscriptions}
        
    except Exception as e:
        print(f"❌ Failed to get active subscriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get subscriptions: {str(e)}")

@api_router.get("/subscriptions/benefits")
async def get_subscription_benefits(current_user: dict = Depends(get_current_user)):
    """Get current subscription benefits/multipliers for user"""
    try:
        user_id = current_user.get("id")
        current_time = datetime.now(timezone.utc)
        
        # Default multipliers (no subscription)
        benefits = {
            "xp_multiplier": 1.0,
            "drop_multiplier": 1.0,
            "zone_kill_multiplier": 1.0,
            "active_subscriptions": []
        }
        
        # Find all active subscriptions for user
        cursor = db.subscriptions.find({
            "user_id": user_id,
            "is_active": True,
            "end_date": {"$gt": current_time}
        })
        
        async for subscription in cursor:
            subscription_type = subscription["subscription_type"]
            benefits["active_subscriptions"].append({
                "type": subscription_type,
                "end_date": subscription["end_date"].isoformat(),
                "days_remaining": (subscription["end_date"] - current_time).days
            })
            
            # Apply subscription benefits
            if subscription_type == "xp_drop_boost":
                benefits["xp_multiplier"] = 2.0
                benefits["drop_multiplier"] = 2.0
            elif subscription_type == "zone_progression_boost":
                benefits["zone_kill_multiplier"] = 2.0
        
        return benefits
        
    except Exception as e:
        print(f"❌ Failed to get subscription benefits: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get benefits: {str(e)}")

# Authentication Routes
@api_router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, response: Response):
    """Register a new user with email and password"""
    try:
        # Check if password meets requirements
        if not validate_password(user_data.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be between 8 and 64 characters"
            )

        # Check if user already exists
        existing_user = await get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        user_dict = {
            "id": str(uuid.uuid4()),
            "email": user_data.email,
            "name": user_data.name,
            "password_hash": get_password_hash(user_data.password),
            "provider": "email"
        }

        created_user = await create_user(user_dict)
        
        # Generate tokens
        access_token = create_access_token(data={"sub": created_user["id"]})
        session_token = secrets.token_urlsafe(32)
        
        # Create session
        await create_session(created_user["id"], session_token)
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )

        # Return user data (exclude password_hash)
        user_response = User(
            id=created_user["id"],
            email=created_user["email"],
            name=created_user["name"],
            created_at=created_user["created_at"],
            is_active=created_user["is_active"],
            provider=created_user["provider"]
        )

        return Token(access_token=access_token, user=user_response)

    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise  # Re-raise HTTPExceptions without wrapping
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), response: Response = None):
    """Login with email and password"""
    try:
        # Find user
        user = await get_user_by_email(form_data.username)  # OAuth2 uses 'username' field
        if not user or not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled"
            )

        # Generate tokens
        access_token = create_access_token(data={"sub": user["id"]})
        session_token = secrets.token_urlsafe(32)
        
        # Create session
        await create_session(user["id"], session_token)
        
        # Set session cookie
        if response:
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=7 * 24 * 60 * 60,  # 7 days
                path="/"
            )

        # Return user data (exclude password_hash)
        user_response = User(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
            is_active=user.get("is_active", True),
            provider=user.get("provider", "email")
        )

        return Token(access_token=access_token, user=user_response)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@api_router.post("/auth/oauth/google")
async def google_oauth_login(request: Request, response: Response):
    """Process Google OAuth login via Emergent Auth"""
    try:
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session ID is required"
            )

        # Process session with Emergent Auth
        session_data = await process_emergent_session(session_id)
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session ID"
            )

        # Check if user exists
        existing_user = await get_user_by_email(session_data.email)
        
        if existing_user:
            # Update existing user if needed
            user = existing_user
        else:
            # Create new user from OAuth data
            user_dict = {
                "id": str(uuid.uuid4()),
                "email": session_data.email,
                "name": session_data.name,
                "provider": "google",
                "oauth_id": session_data.id,
                "picture": session_data.picture
            }
            user = await create_user(user_dict)

        # Generate tokens
        access_token = create_access_token(data={"sub": user["id"]})
        
        # Create session with the provided session_token from Emergent
        await create_session(user["id"], session_data.session_token)
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=session_data.session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )

        # Return user data
        user_response = User(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
            is_active=user.get("is_active", True),
            provider=user.get("provider", "google")
        )

        return Token(access_token=access_token, user=user_response)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth login failed: {str(e)}"
        )

@api_router.get("/auth/me", response_model=User)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return User(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"],
        is_active=current_user.get("is_active", True),
        provider=current_user.get("provider", "email")
    )

@api_router.post("/auth/logout")
async def logout(
    request: Request, 
    response: Response,
    current_user: dict = Depends(get_current_user)
):
    """Logout user and clear session"""
    try:
        # Get session token from cookie
        session_token = request.cookies.get("session_token")
        if session_token:
            await delete_session(session_token)
        
        # Clear session cookie
        response.delete_cookie(
            key="session_token",
            path="/",
            secure=True,
            samesite="none"
        )
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )

@api_router.get("/auth/session/check")
async def check_session(request: Request):
    """Check if current session is valid"""
    try:
        session_token = request.cookies.get("session_token")
        if not session_token:
            return {"authenticated": False}
            
        session = await get_session(session_token)
        if not session:
            return {"authenticated": False}
            
        user = await get_user_by_id(session["user_id"])
        if not user:
            return {"authenticated": False}
            
        user_response = User(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"],
            is_active=user.get("is_active", True),
            provider=user.get("provider", "email")
        )
        
        return {
            "authenticated": True,
            "user": user_response
        }
        
    except Exception as e:
        return {"authenticated": False, "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "https://app.emergent.sh",
        "http://127.0.0.1:3000",
        "https://idle-ninja-fix.preview.emergentagent.com",
        "https://ninja-idle-fix.ngrok.io",
    ],  # Specific origins instead of wildcard
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