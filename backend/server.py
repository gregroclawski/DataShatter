from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Ninja Master Mobile API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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