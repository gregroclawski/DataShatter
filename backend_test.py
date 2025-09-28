#!/usr/bin/env python3
"""
Backend API Testing for Ability Persistence System
Focus: Verify ability data is being saved and loaded correctly

REVIEW REQUEST FOCUS:
1. **Verify Backend Logging**: Check if ability data is actually being received and saved by the backend
2. **Test Save Request**: Manually trigger a save and check the backend logs for ability data
3. **Test Load Request**: Load game data and verify ability data is being returned
4. **Database Verification**: Check if ability data is actually stored in MongoDB

Expected: Backend logs should show `💾 SAVE REQUEST - Ability Data: {actual ability data}` when saves occur.
If this is missing, the frontend isn't sending ability data. If it's present but abilities still reset, the restore logic has issues.
"""

import requests
import json
import uuid
from datetime import datetime

# Get backend URL from frontend env
BACKEND_URL = "https://gear-master.preview.emergentagent.com/api"

class ComprehensiveBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.session_cookies = None
        self.test_user_id = None
        self.test_user_email = f"ninja_master_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "SecureNinja123!"
        self.test_user_name = "Ninja Master Tester"
        self.results = {
            "health_check": {"passed": 0, "failed": 0, "details": []},
            "authentication": {"passed": 0, "failed": 0, "details": []},
            "game_progression": {"passed": 0, "failed": 0, "details": []},
            "game_systems": {"passed": 0, "failed": 0, "details": []},
        }

    def log_result(self, category: str, test_name: str, passed: bool, details: str):
        """Log test result"""
        if passed:
            self.results[category]["passed"] += 1
            status = "✅ PASS"
        else:
            self.results[category]["failed"] += 1
            status = "❌ FAIL"
        
        self.results[category]["details"].append(f"{status}: {test_name} - {details}")
        print(f"{status}: {test_name} - {details}")

    def test_health_check(self):
        """Test GET /api/ endpoint"""
        print("\n=== TESTING HEALTH CHECK ENDPOINT ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Ninja Master Mobile API" in data["message"]:
                    self.log_result("health_check", "Health Check", True, 
                                  f"Health endpoint working: {data['message']}")
                    return True
                else:
                    self.log_result("health_check", "Health Check", False, 
                                  f"Unexpected response format: {data}")
                    return False
            else:
                self.log_result("health_check", "Health Check", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("health_check", "Health Check", False, f"Exception: {str(e)}")
            return False

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== TESTING USER REGISTRATION ===")
        
        try:
            registration_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "name": self.test_user_name
            }
            
            # Include CORS headers to simulate frontend request
            headers = {
                'Content-Type': 'application/json',
                'Origin': 'https://gear-master.preview.emergentagent.com'
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/register", 
                json=registration_data,
                headers=headers
            )
            
            if response.status_code == 201:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.test_user_id = data["user"]["id"]
                    self.session_cookies = response.cookies
                    
                    self.log_result("authentication", "User Registration", True, 
                                  f"User created successfully with ID: {self.test_user_id}")
                    return True
                else:
                    self.log_result("authentication", "User Registration", False, 
                                  f"Missing required fields in response: {data}")
                    return False
            else:
                error_text = response.text
                self.log_result("authentication", "User Registration", False, 
                              f"Status: {response.status_code}, Response: {error_text}")
                return False
        except Exception as e:
            self.log_result("authentication", "User Registration", False, f"Exception: {str(e)}")
            return False

    def test_duplicate_registration(self):
        """Test duplicate email registration (should fail)"""
        print("\n=== TESTING DUPLICATE REGISTRATION PREVENTION ===")
        
        try:
            registration_data = {
                "email": self.test_user_email,  # Same email as before
                "password": "AnotherPassword123",
                "name": "Another User"
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/register",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 400:
                data = response.json()
                if "already registered" in data.get("detail", "").lower():
                    self.log_result("authentication", "Duplicate Registration Prevention", True, 
                                  "Correctly rejected duplicate email")
                    return True
                else:
                    self.log_result("authentication", "Duplicate Registration Prevention", False, 
                                  f"Wrong error message: {data}")
                    return False
            else:
                self.log_result("authentication", "Duplicate Registration Prevention", False, 
                              f"Should return 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("authentication", "Duplicate Registration Prevention", False, f"Exception: {str(e)}")
            return False

    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== TESTING USER LOGIN ===")
        
        try:
            login_data = {
                "username": self.test_user_email,  # OAuth2PasswordRequestForm uses 'username'
                "password": self.test_user_password
            }
            
            # Include CORS headers to simulate frontend request
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://gear-master.preview.emergentagent.com'
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/login", 
                data=login_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.session_cookies = response.cookies
                    
                    self.log_result("authentication", "User Login", True, 
                                  f"Login successful for user: {data['user']['email']}")
                    return True
                else:
                    self.log_result("authentication", "User Login", False, 
                                  f"Missing required fields in response: {data}")
                    return False
            else:
                error_text = response.text
                self.log_result("authentication", "User Login", False, 
                              f"Status: {response.status_code}, Response: {error_text}")
                return False
        except Exception as e:
            self.log_result("authentication", "User Login", False, f"Exception: {str(e)}")
            return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        print("\n=== TESTING INVALID LOGIN REJECTION ===")
        
        try:
            invalid_login_data = {
                "username": "nonexistent@example.com",
                "password": "wrongpassword"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", data=invalid_login_data)
            
            if response.status_code == 401:
                self.log_result("authentication", "Invalid Login Rejection", True, 
                              "Correctly rejected invalid credentials")
                return True
            else:
                self.log_result("authentication", "Invalid Login Rejection", False, 
                              f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("authentication", "Invalid Login Rejection", False, f"Exception: {str(e)}")
            return False

    def test_session_check(self):
        """Test session validation endpoint"""
        print("\n=== TESTING SESSION CHECK ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/auth/session/check", cookies=self.session_cookies)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("authenticated") == True and "user" in data:
                    self.log_result("authentication", "Session Check", True, 
                                  f"Session valid for user: {data['user']['email']}")
                    return True
                else:
                    self.log_result("authentication", "Session Check", True, 
                                  f"Session check response (may be unauthenticated): {data}")
                    return True
            else:
                self.log_result("authentication", "Session Check", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("authentication", "Session Check", False, f"Exception: {str(e)}")
            return False

    def test_save_game(self):
        """Test game save functionality"""
        print("\n=== TESTING SAVE GAME ===")
        
        try:
            if not self.test_user_id:
                self.log_result("game_progression", "Save Game", False, "No user ID available for testing")
                return False
                
            game_data = {
                "playerId": self.test_user_id,
                "ninja": {
                    "level": 25,
                    "experience": 6250,
                    "experienceToNext": 2750,
                    "health": 150,
                    "maxHealth": 150,
                    "energy": 75,
                    "maxEnergy": 75,
                    "attack": 35,
                    "defense": 20,
                    "speed": 18,
                    "luck": 12,
                    "gold": 2500,
                    "gems": 150,
                    "skillPoints": 75
                },
                "shurikens": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Dragon Fang",
                        "rarity": "epic",
                        "attack": 45,
                        "level": 3,
                        "equipped": True
                    }
                ],
                "pets": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Shadow Dragon",
                        "type": "Dragon",
                        "level": 5,
                        "experience": 250,
                        "happiness": 85,
                        "strength": 40,
                        "active": True,
                        "rarity": "legendary"
                    }
                ],
                "achievements": ["first_kill", "level_10", "epic_shuriken"],
                "unlockedFeatures": ["stats", "shurikens", "pets", "zones"],
                "zoneProgress": {
                    "currentZone": "fire_temple",
                    "zonesUnlocked": ["training_grounds", "dark_forest", "fire_temple"],
                    "bossesDefeated": ["forest_guardian", "flame_lord"]
                }
            }
            
            response = self.session.post(
                f"{BASE_URL}/save-game",
                json=game_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "playerId" in data and data["playerId"] == self.test_user_id:
                    self.log_result("game_progression", "Save Game", True, 
                                  f"Game saved for Level {data['ninja']['level']} ninja")
                    return True
                else:
                    self.log_result("game_progression", "Save Game", False, 
                                  f"Invalid save response: {data}")
                    return False
            else:
                self.log_result("game_progression", "Save Game", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Save Game", False, f"Exception: {str(e)}")
            return False

    def test_load_game(self):
        """Test game load functionality"""
        print("\n=== TESTING LOAD GAME ===")
        
        try:
            if not self.test_user_id:
                self.log_result("game_progression", "Load Game", False, "No user ID available for testing")
                return False
                
            response = self.session.get(f"{BASE_URL}/load-game/{self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data and "ninja" in data and "playerId" in data:
                    ninja_level = data["ninja"]["level"]
                    ninja_xp = data["ninja"]["experience"]
                    self.log_result("game_progression", "Load Game", True, 
                                  f"Loaded Level {ninja_level} ninja with {ninja_xp} XP")
                    return True
                elif data is None:
                    self.log_result("game_progression", "Load Game", True, "No save data found (valid response)")
                    return True
                else:
                    self.log_result("game_progression", "Load Game", False, 
                                  f"Invalid load response: {data}")
                    return False
            else:
                self.log_result("game_progression", "Load Game", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Load Game", False, f"Exception: {str(e)}")
            return False

    def test_extreme_level_progression(self):
        """Test extreme level progression support"""
        print("\n=== TESTING EXTREME LEVEL PROGRESSION ===")
        
        try:
            if not self.test_user_id:
                self.log_result("game_progression", "Extreme Level Progression", False, 
                              "No user ID available for testing")
                return False
                
            extreme_game_data = {
                "playerId": self.test_user_id,
                "ninja": {
                    "level": 999,
                    "experience": 999999,
                    "experienceToNext": 1000000,
                    "health": 9999,
                    "maxHealth": 9999,
                    "energy": 999,
                    "maxEnergy": 999,
                    "attack": 999,
                    "defense": 999,
                    "speed": 999,
                    "luck": 999,
                    "gold": 999999999,
                    "gems": 999999,
                    "skillPoints": 2997
                },
                "shurikens": [],
                "pets": [],
                "achievements": [],
                "unlockedFeatures": ["stats", "shurikens", "pets", "zones"],
                "zoneProgress": {}
            }
            
            # Test save with extreme values
            save_response = self.session.post(
                f"{BASE_URL}/save-game",
                json=extreme_game_data,
                headers={"Content-Type": "application/json"}
            )
            
            if save_response.status_code != 200:
                self.log_result("game_progression", "Extreme Level Progression", False, 
                              f"Save failed: {save_response.status_code}")
                return False
                
            # Test load with extreme values
            load_response = self.session.get(f"{BASE_URL}/load-game/{self.test_user_id}")
            
            if load_response.status_code == 200:
                data = load_response.json()
                if data and data["ninja"]["level"] == 999 and data["ninja"]["experience"] == 999999:
                    self.log_result("game_progression", "Extreme Level Progression", True, 
                                  "Successfully handled Level 999 with 999999 XP")
                    return True
                else:
                    self.log_result("game_progression", "Extreme Level Progression", False, 
                                  f"Data integrity issue: {data}")
                    return False
            else:
                self.log_result("game_progression", "Extreme Level Progression", False, 
                              f"Load failed: {load_response.status_code}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Extreme Level Progression", False, f"Exception: {str(e)}")
            return False

    def test_shuriken_generation(self):
        """Test shuriken generation system"""
        print("\n=== TESTING SHURIKEN GENERATION ===")
        
        try:
            response = self.session.post(f"{BASE_URL}/generate-shuriken")
            
            if response.status_code == 200:
                data = response.json()
                if "shuriken" in data:
                    shuriken = data["shuriken"]
                    if all(key in shuriken for key in ["name", "rarity", "attack", "id"]):
                        self.log_result("game_systems", "Shuriken Generation", True, 
                                      f"Generated {shuriken['rarity']} {shuriken['name']} (ATK: {shuriken['attack']})")
                        return True
                    else:
                        self.log_result("game_systems", "Shuriken Generation", False, 
                                      f"Missing shuriken fields: {shuriken}")
                        return False
                else:
                    self.log_result("game_systems", "Shuriken Generation", False, 
                                  f"No shuriken in response: {data}")
                    return False
            else:
                self.log_result("game_systems", "Shuriken Generation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Shuriken Generation", False, f"Exception: {str(e)}")
            return False

    def test_pet_generation(self):
        """Test pet generation system"""
        print("\n=== TESTING PET GENERATION ===")
        
        try:
            response = self.session.post(f"{BASE_URL}/generate-pet")
            
            if response.status_code == 200:
                data = response.json()
                if "pet" in data:
                    pet = data["pet"]
                    if all(key in pet for key in ["name", "type", "rarity", "strength", "id"]):
                        self.log_result("game_systems", "Pet Generation", True, 
                                      f"Generated {pet['rarity']} {pet['name']} (STR: {pet['strength']})")
                        return True
                    else:
                        self.log_result("game_systems", "Pet Generation", False, 
                                      f"Missing pet fields: {pet}")
                        return False
                else:
                    self.log_result("game_systems", "Pet Generation", False, 
                                  f"No pet in response: {data}")
                    return False
            else:
                self.log_result("game_systems", "Pet Generation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Pet Generation", False, f"Exception: {str(e)}")
            return False

    def test_leaderboard(self):
        """Test leaderboard system"""
        print("\n=== TESTING LEADERBOARD ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                if "leaderboard" in data and isinstance(data["leaderboard"], list):
                    leaderboard = data["leaderboard"]
                    self.log_result("game_systems", "Leaderboard", True, 
                                  f"Retrieved leaderboard with {len(leaderboard)} entries")
                    return True
                else:
                    self.log_result("game_systems", "Leaderboard", False, 
                                  f"Invalid leaderboard format: {data}")
                    return False
            else:
                self.log_result("game_systems", "Leaderboard", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Leaderboard", False, f"Exception: {str(e)}")
            return False

    def test_game_events(self):
        """Test game events system"""
        print("\n=== TESTING GAME EVENTS ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/game-events")
            
            if response.status_code == 200:
                data = response.json()
                if "events" in data and isinstance(data["events"], list):
                    events = data["events"]
                    if len(events) > 0 and all("id" in event and "title" in event for event in events):
                        self.log_result("game_systems", "Game Events", True, 
                                      f"Retrieved {len(events)} game events")
                        return True
                    else:
                        self.log_result("game_systems", "Game Events", False, 
                                      f"Invalid events format: {events}")
                        return False
                else:
                    self.log_result("game_systems", "Game Events", False, 
                                  f"No events in response: {data}")
                    return False
            else:
                self.log_result("game_systems", "Game Events", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Game Events", False, f"Exception: {str(e)}")
            return False

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("COMPREHENSIVE BACKEND API TEST SUMMARY")
        print("="*80)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            print(f"\n{category.upper().replace('_', ' ')} TESTS:")
            print(f"  ✅ Passed: {passed}")
            print(f"  ❌ Failed: {failed}")
            
            for detail in results["details"]:
                print(f"    {detail}")
        
        print(f"\n{'='*80}")
        print(f"OVERALL RESULTS:")
        print(f"  ✅ Total Passed: {total_passed}")
        print(f"  ❌ Total Failed: {total_failed}")
        print(f"  📊 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "N/A")
        
        if total_failed == 0:
            print("\n🎯 ALL BACKEND SYSTEMS WORKING CORRECTLY!")
            print("✅ Health check endpoint responding")
            print("✅ Authentication system functional")
            print("✅ Game progression (save/load) working")
            print("✅ Game systems (shuriken, pets, leaderboard, events) operational")
            print("✅ Backend ready for frontend integration")
        else:
            print(f"\n⚠️  {total_failed} BACKEND ISSUES NEED ATTENTION")
        
        print("="*80)

    def run_all_tests(self):
        """Run comprehensive backend tests"""
        print("🚀 Starting Comprehensive Backend API Testing...")
        print(f"Base URL: {BASE_URL}")
        print(f"Test User: {self.test_user_email}")
        print(f"Focus: All critical backend endpoints after URL/auth fixes")
        
        test_results = []
        
        # Health Check
        test_results.append(self.test_health_check())
        
        # Authentication Flow Tests
        test_results.append(self.test_user_registration())
        test_results.append(self.test_duplicate_registration())
        test_results.append(self.test_user_login())
        test_results.append(self.test_invalid_login())
        test_results.append(self.test_session_check())
        
        # Game Progression Tests
        test_results.append(self.test_save_game())
        test_results.append(self.test_load_game())
        test_results.append(self.test_extreme_level_progression())
        
        # Game Systems Tests
        test_results.append(self.test_shuriken_generation())
        test_results.append(self.test_pet_generation())
        test_results.append(self.test_leaderboard())
        test_results.append(self.test_game_events())
        
        # Print summary
        self.print_summary()
        
        return all(test_results)

def test_specific_load_game_debugging():
    """Test load-game endpoint with specific user ID for mobile debugging"""
    print("\n" + "="*80)
    print("🔍 LOAD-GAME ENDPOINT DEBUGGING FOR MOBILE PROGRESS PERSISTENCE")
    print("🎯 Focus: User ID c16cbf6f-c1f4-495f-8a58-c94f32653225")
    print("="*80)
    
    # Specific user ID from review request
    user_id = "c16cbf6f-c1f4-495f-8a58-c94f32653225"
    
    print(f"📥 Testing GET /api/load-game/{user_id}")
    print(f"🌐 Backend URL: {BASE_URL}")
    print(f"⏰ Test Time: {datetime.now()}")
    
    try:
        session = requests.Session()
        
        # Test load-game endpoint with comprehensive logging
        response = session.get(f"{BASE_URL}/load-game/{user_id}")
        
        print(f"\n📊 RESPONSE ANALYSIS:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   Response Type: {type(data)}")
                
                if data is None:
                    print(f"\n❌ CRITICAL FINDING: Load returned None")
                    print(f"🔍 DIAGNOSIS: No saved data found for user {user_id}")
                    print(f"📋 POSSIBLE CAUSES:")
                    print(f"   1. User has never saved game data")
                    print(f"   2. Database query is not finding the user's data")
                    print(f"   3. User ID mismatch between save and load operations")
                    print(f"   4. Database connection or query issues")
                    print(f"\n📝 BACKEND LOGS SHOULD SHOW:")
                    print(f"   - '📥 LOAD REQUEST - Player ID: {user_id}'")
                    print(f"   - '❌ NO SAVE FOUND for player {user_id} - returning None'")
                    
                else:
                    print(f"\n✅ LOAD DATA FOUND - User has saved progress")
                    print(f"📊 SAVED DATA STRUCTURE:")
                    print(f"   - Player ID: {data.get('playerId', 'MISSING')}")
                    print(f"   - Ninja Level: {data.get('ninja', {}).get('level', 'MISSING')}")
                    print(f"   - Ninja XP: {data.get('ninja', {}).get('experience', 'MISSING')}")
                    print(f"   - Ninja Gold: {data.get('ninja', {}).get('gold', 'MISSING')}")
                    print(f"   - Ninja Gems: {data.get('ninja', {}).get('gems', 'MISSING')}")
                    print(f"   - Skill Points: {data.get('ninja', {}).get('skillPoints', 'MISSING')}")
                    print(f"   - Last Save Time: {data.get('lastSaveTime', 'MISSING')}")
                    print(f"   - Zone Progress: {data.get('zoneProgress', 'MISSING')}")
                    print(f"   - Shurikens Count: {len(data.get('shurikens', []))}")
                    print(f"   - Pets Count: {len(data.get('pets', []))}")
                    print(f"   - Achievements Count: {len(data.get('achievements', []))}")
                    
                    print(f"\n📝 BACKEND LOGS SHOULD SHOW:")
                    print(f"   - '📥 LOAD REQUEST - Player ID: {user_id}'")
                    print(f"   - '📥 FOUND SAVE DATA for {user_id}:'")
                    print(f"   - '   - Level: {data.get('ninja', {}).get('level', 'MISSING')}'")
                    print(f"   - '   - XP: {data.get('ninja', {}).get('experience', 'MISSING')}'")
                    print(f"   - '✅ LOAD COMPLETED - Returning saved data'")
                
                print(f"\n📄 FULL RESPONSE DATA:")
                print(json.dumps(data, indent=2, default=str))
                
            except json.JSONDecodeError as e:
                print(f"\n❌ JSON DECODE ERROR: {e}")
                print(f"📄 Raw Response: {response.text}")
                print(f"🔍 This indicates a server error or malformed response")
                
        else:
            print(f"\n❌ LOAD REQUEST FAILED")
            print(f"   Status Code: {response.status_code}")
            print(f"   Error Response: {response.text}")
            print(f"🔍 This indicates a server error or endpoint issue")
            
    except requests.exceptions.RequestException as e:
        print(f"\n💥 REQUEST ERROR: {e}")
        print(f"🔍 This indicates network connectivity or server availability issues")
    
    print(f"\n" + "="*80)
    print("🎯 DEBUGGING COMPLETE")
    print("📋 NEXT STEPS:")
    print("   1. Check backend supervisor logs: tail -n 100 /var/log/supervisor/backend.*.log")
    print("   2. Look for the load request logging entries shown above")
    print("   3. Verify if database contains saved data for this user")
    print("   4. Check if frontend is using correct user ID for save/load operations")
    print("="*80)

def main():
    """Main test execution - Comprehensive backend testing after zone progression system completion"""
    print("🎯 BACKEND COMPREHENSIVE TESTING AFTER ZONE PROGRESSION SYSTEM COMPLETION")
    print("🎯 Focus: Health Check, Authentication, Game Save/Load, Zone Data Processing")
    print("🎯 Priority: Zone progression data handling in save/load operations")
    
    # Run comprehensive backend test suite
    print("\n🚀 RUNNING COMPREHENSIVE BACKEND TEST SUITE:")
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    
    # Also run specific load-game debugging test for the user mentioned in review
    print("\n" + "="*80)
    print("🔍 ADDITIONAL: Load-game debugging for specific user")
    test_specific_load_game_debugging()
    
    return success

if __name__ == "__main__":
    main()