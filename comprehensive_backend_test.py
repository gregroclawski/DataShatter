#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Shadow Clone Implementation Review
Focus: All core authentication, game save/load, and system endpoints
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://data-shatter.preview.emergentagent.com/api"

class ComprehensiveBackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_user_id = str(uuid.uuid4())
        self.test_email = f"shadowtest_{self.test_user_id[:8]}@example.com"
        self.test_password = "shadowpass123"
        self.test_name = "Shadow Clone Tester"
        self.access_token = None
        self.session_cookies = None
        
    def log_test(self, test_name, status, details=""):
        status_symbol = "✅" if status else "❌"
        print(f"{status_symbol} {test_name}")
        if details:
            print(f"   {details}")
        return status
    
    def test_health_check(self):
        """Test /api/ health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                return self.log_test("Health Check (/api/)", True, 
                    f"API responding: {data.get('message', 'OK')}")
            else:
                return self.log_test("Health Check (/api/)", False, 
                    f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Health Check (/api/)", False, f"Error: {str(e)}")
    
    def test_auth_register(self):
        """Test /api/auth/register endpoint"""
        try:
            payload = {
                "email": self.test_email,
                "password": self.test_password,
                "name": self.test_name
            }
            response = self.session.post(f"{self.base_url}/auth/register", json=payload)
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data.get("access_token")
                self.session_cookies = response.cookies
                user_data = data.get("user", {})
                return self.log_test("Auth Register (/api/auth/register)", True, 
                    f"User created: {user_data.get('name')} with JWT token")
            else:
                return self.log_test("Auth Register (/api/auth/register)", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("Auth Register (/api/auth/register)", False, f"Error: {str(e)}")
    
    def test_auth_login(self):
        """Test /api/auth/login endpoint"""
        try:
            # Use form data for OAuth2PasswordRequestForm
            payload = {
                "username": self.test_email,  # OAuth2 uses 'username' field
                "password": self.test_password
            }
            response = self.session.post(f"{self.base_url}/auth/login", data=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.session_cookies = response.cookies
                user_data = data.get("user", {})
                return self.log_test("Auth Login (/api/auth/login)", True, 
                    f"Login successful with JWT token for {user_data.get('name')}")
            else:
                return self.log_test("Auth Login (/api/auth/login)", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("Auth Login (/api/auth/login)", False, f"Error: {str(e)}")
    
    def test_save_game_with_shadow_clone(self):
        """Test /api/save-game with Shadow Clone ability data"""
        try:
            # Comprehensive game data with Shadow Clone at level 1
            save_data = {
                "playerId": self.test_user_id,
                "ninja": {
                    "level": 8,
                    "experience": 2000,
                    "experienceToNext": 2400,
                    "health": 180,
                    "maxHealth": 180,
                    "energy": 90,
                    "maxEnergy": 90,
                    "attack": 35,
                    "defense": 20,
                    "speed": 25,
                    "luck": 12,
                    "gold": 750,
                    "gems": 40,
                    "skillPoints": 24
                },
                "shurikens": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Shadow Shuriken",
                        "rarity": "epic",
                        "attack": 35,
                        "level": 2,
                        "equipped": True
                    }
                ],
                "pets": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Shadow Companion",
                        "type": "Shadow Cat",
                        "level": 3,
                        "experience": 120,
                        "happiness": 85,
                        "strength": 28,
                        "active": True,
                        "rarity": "epic"
                    }
                ],
                "achievements": ["first_kill", "level_5", "shadow_master"],
                "unlockedFeatures": ["stats", "shurikens", "pets", "abilities", "shadow_clone"],
                "zoneProgress": {
                    "currentZone": 5,
                    "totalKills": 280,
                    "zones": {
                        "1": {"killsInLevel": 30, "completed": True},
                        "2": {"killsInLevel": 35, "completed": True},
                        "3": {"killsInLevel": 40, "completed": True},
                        "4": {"killsInLevel": 45, "completed": True},
                        "5": {"killsInLevel": 35, "completed": False}
                    }
                },
                "equipment": {
                    "helmet": {"name": "Shadow Mask", "defense": 8, "special": "stealth"},
                    "armor": {"name": "Shadow Cloak", "defense": 12, "special": "evasion"},
                    "weapon": {"name": "Shadow Blade", "attack": 18, "special": "critical"}
                },
                "abilityData": {
                    "equippedAbilities": [
                        {
                            "id": "basic_shuriken",
                            "name": "Basic Shuriken",
                            "level": 4,
                            "icon": "🌟",
                            "damage": 20,
                            "cooldown": 800,
                            "currentCooldown": 0,
                            "lastUsed": 0
                        },
                        {
                            "id": "fire_shuriken", 
                            "name": "Fire Shuriken",
                            "level": 3,
                            "icon": "🔥",
                            "damage": 35,
                            "cooldown": 1800,
                            "currentCooldown": 0,
                            "lastUsed": 0
                        },
                        {
                            "id": "ice_shuriken",
                            "name": "Ice Shuriken", 
                            "level": 2,
                            "icon": "❄️",
                            "damage": 28,
                            "cooldown": 2200,
                            "currentCooldown": 0,
                            "lastUsed": 0
                        },
                        {
                            "id": "poison_shuriken",
                            "name": "Poison Shuriken",
                            "level": 2,
                            "icon": "☠️", 
                            "damage": 25,
                            "cooldown": 2800,
                            "currentCooldown": 0,
                            "lastUsed": 0
                        },
                        {
                            "id": "shadow_clone",
                            "name": "Shadow Clone",
                            "level": 1,
                            "icon": "👥",
                            "damage": 40,
                            "cooldown": 4500,
                            "currentCooldown": 0,
                            "lastUsed": 0,
                            "description": "Creates shadow clones that attack enemies",
                            "special": "multi_target"
                        }
                    ],
                    "availableAbilities": {
                        "basic_shuriken": {
                            "id": "basic_shuriken",
                            "level": 4,
                            "stats": {"baseDamage": 20, "cooldown": 0.8, "range": 150}
                        },
                        "fire_shuriken": {
                            "id": "fire_shuriken",
                            "level": 3,
                            "stats": {"baseDamage": 35, "cooldown": 1.8, "range": 150, "duration": 6}
                        },
                        "ice_shuriken": {
                            "id": "ice_shuriken",
                            "level": 2,
                            "stats": {"baseDamage": 28, "cooldown": 2.2, "range": 150, "duration": 4}
                        },
                        "poison_shuriken": {
                            "id": "poison_shuriken",
                            "level": 2,
                            "stats": {"baseDamage": 25, "cooldown": 2.8, "range": 150, "duration": 8}
                        },
                        "shadow_clone": {
                            "id": "shadow_clone",
                            "level": 1,
                            "stats": {"baseDamage": 40, "cooldown": 4.5, "duration": 25, "clones": 2}
                        },
                        "whirlwind_strike": {
                            "id": "whirlwind_strike",
                            "level": 1,
                            "stats": {"baseDamage": 45, "cooldown": 6.0, "aoeRadius": 400}
                        },
                        "lightning_bolt": {
                            "id": "lightning_bolt",
                            "level": 1,
                            "stats": {"baseDamage": 80, "cooldown": 8.0, "range": 200}
                        }
                    },
                    "activeSynergies": ["shadow_mastery"],
                    "deckConfiguration": {
                        "slots": 5,
                        "unlockedSlots": 5,
                        "autocast": True
                    }
                }
            }
            
            response = self.session.post(f"{self.base_url}/save-game", json=save_data)
            
            if response.status_code == 200:
                data = response.json()
                ninja_level = data.get("ninja", {}).get("level", 0)
                ability_data = data.get("abilityData", {})
                equipped_abilities = ability_data.get("equippedAbilities", [])
                
                # Verify Shadow Clone is saved at level 1
                shadow_clone = next(
                    (ability for ability in equipped_abilities if ability.get("id") == "shadow_clone"),
                    None
                )
                
                if shadow_clone and shadow_clone.get("level") == 1:
                    return self.log_test("Save Game with Shadow Clone (/api/save-game)", True, 
                        f"Level {ninja_level} ninja saved with Shadow Clone at level {shadow_clone.get('level')}")
                else:
                    return self.log_test("Save Game with Shadow Clone (/api/save-game)", False, 
                        "Shadow Clone ability not found or incorrect level in saved data")
            else:
                return self.log_test("Save Game with Shadow Clone (/api/save-game)", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("Save Game with Shadow Clone (/api/save-game)", False, f"Error: {str(e)}")
    
    def test_load_game_with_shadow_clone(self):
        """Test /api/load-game and verify Shadow Clone ability data"""
        try:
            response = self.session.get(f"{self.base_url}/load-game/{self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data is None:
                    return self.log_test("Load Game with Shadow Clone (/api/load-game)", False, 
                        "No save data found")
                
                ninja_level = data.get("ninja", {}).get("level", 0)
                ability_data = data.get("abilityData", {})
                equipped_abilities = ability_data.get("equippedAbilities", [])
                available_abilities = ability_data.get("availableAbilities", {})
                
                # Verify Shadow Clone is present and at level 1
                shadow_clone_equipped = next(
                    (ability for ability in equipped_abilities if ability.get("id") == "shadow_clone"),
                    None
                )
                
                shadow_clone_available = available_abilities.get("shadow_clone", {})
                
                if (shadow_clone_equipped and shadow_clone_equipped.get("level") == 1 and
                    shadow_clone_available and shadow_clone_available.get("level") == 1):
                    return self.log_test("Load Game with Shadow Clone (/api/load-game)", True, 
                        f"Level {ninja_level} ninja loaded with Shadow Clone (equipped & available)")
                else:
                    return self.log_test("Load Game with Shadow Clone (/api/load-game)", False, 
                        "Shadow Clone ability data incomplete in loaded game")
            else:
                return self.log_test("Load Game with Shadow Clone (/api/load-game)", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            return self.log_test("Load Game with Shadow Clone (/api/load-game)", False, f"Error: {str(e)}")
    
    def test_all_game_system_endpoints(self):
        """Test all other game system endpoints for regressions"""
        results = []
        
        # Test shuriken generation
        try:
            response = self.session.post(f"{self.base_url}/generate-shuriken")
            if response.status_code == 200:
                data = response.json()
                shuriken = data.get("shuriken", {})
                results.append(self.log_test("Shuriken Generation (/api/generate-shuriken)", True, 
                    f"Generated {shuriken.get('rarity')} {shuriken.get('name')} (ATK:{shuriken.get('attack')})"))
            else:
                results.append(self.log_test("Shuriken Generation (/api/generate-shuriken)", False, 
                    f"Status: {response.status_code}"))
        except Exception as e:
            results.append(self.log_test("Shuriken Generation (/api/generate-shuriken)", False, f"Error: {str(e)}"))
        
        # Test pet generation
        try:
            response = self.session.post(f"{self.base_url}/generate-pet")
            if response.status_code == 200:
                data = response.json()
                pet = data.get("pet", {})
                results.append(self.log_test("Pet Generation (/api/generate-pet)", True, 
                    f"Generated {pet.get('rarity')} {pet.get('name')} (STR:{pet.get('strength')})"))
            else:
                results.append(self.log_test("Pet Generation (/api/generate-pet)", False, 
                    f"Status: {response.status_code}"))
        except Exception as e:
            results.append(self.log_test("Pet Generation (/api/generate-pet)", False, f"Error: {str(e)}"))
        
        # Test leaderboard
        try:
            response = self.session.get(f"{self.base_url}/leaderboard")
            if response.status_code == 200:
                data = response.json()
                leaderboard = data.get("leaderboard", [])
                results.append(self.log_test("Leaderboard System (/api/leaderboard)", True, 
                    f"Retrieved {len(leaderboard)} entries"))
            else:
                results.append(self.log_test("Leaderboard System (/api/leaderboard)", False, 
                    f"Status: {response.status_code}"))
        except Exception as e:
            results.append(self.log_test("Leaderboard System (/api/leaderboard)", False, f"Error: {str(e)}"))
        
        # Test game events
        try:
            response = self.session.get(f"{self.base_url}/game-events")
            if response.status_code == 200:
                data = response.json()
                events = data.get("events", [])
                results.append(self.log_test("Game Events System (/api/game-events)", True, 
                    f"Retrieved {len(events)} events"))
            else:
                results.append(self.log_test("Game Events System (/api/game-events)", False, 
                    f"Status: {response.status_code}"))
        except Exception as e:
            results.append(self.log_test("Game Events System (/api/game-events)", False, f"Error: {str(e)}"))
        
        return all(results)
    
    def test_session_management(self):
        """Test session management endpoints"""
        try:
            # Test session check
            response = self.session.get(f"{self.base_url}/auth/session/check")
            if response.status_code == 200:
                data = response.json()
                is_authenticated = data.get("authenticated", False)
                if is_authenticated:
                    user_data = data.get("user", {})
                    return self.log_test("Session Management (/api/auth/session/check)", True, 
                        f"Session valid for: {user_data.get('name')}")
                else:
                    return self.log_test("Session Management (/api/auth/session/check)", True, 
                        "Session check working (not authenticated)")
            else:
                return self.log_test("Session Management (/api/auth/session/check)", False, 
                    f"Status: {response.status_code}")
        except Exception as e:
            return self.log_test("Session Management (/api/auth/session/check)", False, f"Error: {str(e)}")
    
    def run_comprehensive_tests(self):
        """Run all comprehensive backend tests for Shadow Clone review"""
        print("🚀 COMPREHENSIVE BACKEND TESTING FOR SHADOW CLONE IMPLEMENTATION")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test User: {self.test_email}")
        print("Focus: Shadow Clone functionality and no regressions")
        print("=" * 80)
        
        results = []
        
        # Core API Health Check
        print("\n📡 CORE API HEALTH CHECK")
        results.append(self.test_health_check())
        
        # Authentication Flow Tests
        print("\n🔐 AUTHENTICATION FLOW TESTS")
        results.append(self.test_auth_register())
        results.append(self.test_auth_login())
        results.append(self.test_session_management())
        
        # Shadow Clone Specific Tests
        print("\n👥 SHADOW CLONE ABILITY PERSISTENCE TESTS")
        results.append(self.test_save_game_with_shadow_clone())
        results.append(self.test_load_game_with_shadow_clone())
        
        # Regression Tests for All Game Systems
        print("\n🎮 GAME SYSTEMS REGRESSION TESTS")
        results.append(self.test_all_game_system_endpoints())
        
        # Summary
        print("\n" + "=" * 80)
        passed = sum(results)
        total = len(results)
        success_rate = (passed / total) * 100 if total > 0 else 0
        
        print(f"🎯 COMPREHENSIVE TEST SUMMARY: {passed}/{total} tests passed ({success_rate:.1f}%)")
        
        if success_rate == 100:
            print("✅ ALL TESTS PASSED - Shadow Clone implementation successful!")
            print("   - All core authentication endpoints working")
            print("   - Shadow Clone ability data persistence working")
            print("   - No regressions detected in game systems")
            print("   - Backend is fully functional and ready")
        elif success_rate >= 90:
            print("⚠️  MOSTLY WORKING - Minor issues detected")
        else:
            print("❌ CRITICAL ISSUES - Backend needs attention")
        
        return success_rate == 100

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_comprehensive_tests()
    sys.exit(0 if success else 1)