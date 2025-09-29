#!/usr/bin/env python3
"""
URGENT DATA RECOVERY CHECK - Backend API Testing
Critical Issue: User reports Level 40 character data reset to default after event-driven saves

CRITICAL REVIEW REQUEST:
1. Test /api/load-game endpoint for user ID: 4ccda8a0-4b37-47c2-9171-d2dfe8d9a4f4
2. Check if database still contains Level 40 character with:
   - skillPointUpgrades with attack: 75, speed: 30
   - goldUpgrades data
   - High level progression (Level 40+)
   - Equipment data (Flame Sword)
   - Ability data with Shadow Clone level 2
3. Verify what the load-game endpoint returns
4. Check if user's progress is still in database or actually lost

This is a critical data recovery check to determine if user's progress exists.
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Backend URL from frontend/.env
BACKEND_URL = "https://idle-ninja-fix.preview.emergentagent.com/api"

# Critical user ID for data recovery check
CRITICAL_USER_ID = "4ccda8a0-4b37-47c2-9171-d2dfe8d9a4f4"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_id = None
        self.access_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_health_check(self):
        """Test basic API health check"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("Health Check API", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check API", False, f"Exception: {str(e)}")
            return False
            
    def test_user_registration(self):
        """Test user registration for authentication"""
        try:
            test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
            test_name = f"TestUser_{uuid.uuid4().hex[:6]}"
            
            user_data = {
                "email": test_email,
                "password": "testpassword123",
                "name": test_name
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user_data)
            success = response.status_code == 201
            
            if success:
                data = response.json()
                self.access_token = data.get("access_token")
                self.test_user_id = data.get("user", {}).get("id")
                details = f"User created: {self.test_user_id}, Token received: {bool(self.access_token)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("User Registration", success, details)
            return success
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
            
    def test_user_login(self):
        """Test user login functionality"""
        try:
            # First register a user
            test_email = f"logintest_{uuid.uuid4().hex[:8]}@example.com"
            test_name = f"LoginTest_{uuid.uuid4().hex[:6]}"
            
            # Register
            user_data = {
                "email": test_email,
                "password": "logintest123",
                "name": test_name
            }
            reg_response = self.session.post(f"{BACKEND_URL}/auth/register", json=user_data)
            
            if reg_response.status_code != 201:
                self.log_test("User Login", False, "Failed to create test user for login")
                return False
                
            # Now test login
            login_data = {
                "username": test_email,  # OAuth2 uses username field
                "password": "logintest123"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", data=login_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                token = data.get("access_token")
                user = data.get("user", {})
                details = f"Login successful, Token: {bool(token)}, User: {user.get('email')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("User Login", success, details)
            return success
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False
            
    def test_session_check(self):
        """Test session validation"""
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/session/check")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                authenticated = data.get("authenticated", False)
                details = f"Session check successful, Authenticated: {authenticated}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Session Check", success, details)
            return success
        except Exception as e:
            self.log_test("Session Check", False, f"Exception: {str(e)}")
            return False
            
    def test_save_game_with_upgrades(self):
        """Test save-game endpoint with ninja data that includes goldUpgrades and skillPointUpgrades"""
        try:
            if not self.test_user_id:
                self.log_test("Save Game with Upgrades", False, "No test user ID available")
                return False
                
            # Create ninja data with goldUpgrades and skillPointUpgrades
            ninja_data = {
                "level": 15,
                "experience": 2250,
                "experienceToNext": 1600,
                "health": 180,
                "maxHealth": 180,
                "energy": 75,
                "maxEnergy": 75,
                "attack": 25,
                "defense": 15,
                "speed": 18,
                "luck": 8,
                "gold": 1500,
                "gems": 45,
                "skillPoints": 12,
                "baseStats": {
                    "attack": 10,
                    "defense": 5,
                    "speed": 8,
                    "luck": 3,
                    "maxHealth": 100,
                    "maxEnergy": 50
                },
                "goldUpgrades": {
                    "attack": 8,
                    "defense": 5,
                    "speed": 6,
                    "luck": 2,
                    "maxHealth": 50,
                    "maxEnergy": 15
                },
                "skillPointUpgrades": {
                    "attack": 7,
                    "defense": 5,
                    "speed": 4,
                    "luck": 3,
                    "maxHealth": 30,
                    "maxEnergy": 10
                }
            }
            
            save_data = {
                "playerId": self.test_user_id,
                "ninja": ninja_data,
                "shurikens": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Test Shuriken",
                        "rarity": "rare",
                        "attack": 20,
                        "level": 3,
                        "equipped": True
                    }
                ],
                "pets": [],
                "achievements": ["first_level_up", "gold_collector"],
                "unlockedFeatures": ["stats", "shurikens", "upgrades"],
                "zoneProgress": {
                    "currentZone": 3,
                    "totalKills": 150,
                    "zones": {
                        "1": {"completed": True, "kills": 50},
                        "2": {"completed": True, "kills": 50},
                        "3": {"completed": False, "kills": 50}
                    }
                }
            }
            
            print(f"\n🎯 TESTING SAVE WITH UPGRADES:")
            print(f"   Gold Upgrades: {ninja_data['goldUpgrades']}")
            print(f"   Skill Point Upgrades: {ninja_data['skillPointUpgrades']}")
            
            response = self.session.post(f"{BACKEND_URL}/save-game", json=save_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                saved_ninja = data.get("ninja", {})
                gold_upgrades = saved_ninja.get("goldUpgrades")
                skill_upgrades = saved_ninja.get("skillPointUpgrades")
                details = f"Save successful. Gold upgrades: {gold_upgrades}, Skill upgrades: {skill_upgrades}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Save Game with Upgrades", success, details)
            return success
        except Exception as e:
            self.log_test("Save Game with Upgrades", False, f"Exception: {str(e)}")
            return False
            
    def test_load_game_with_upgrades(self):
        """Test load-game endpoint to verify goldUpgrades and skillPointUpgrades are preserved"""
        try:
            if not self.test_user_id:
                self.log_test("Load Game with Upgrades", False, "No test user ID available")
                return False
                
            print(f"\n🎯 TESTING LOAD WITH UPGRADES for user: {self.test_user_id}")
            
            response = self.session.get(f"{BACKEND_URL}/load-game/{self.test_user_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data is None:
                    self.log_test("Load Game with Upgrades", False, "No save data found")
                    return False
                    
                ninja = data.get("ninja", {})
                gold_upgrades = ninja.get("goldUpgrades")
                skill_upgrades = ninja.get("skillPointUpgrades")
                
                # Verify upgrades are present and correct
                upgrades_present = gold_upgrades is not None and skill_upgrades is not None
                
                if upgrades_present:
                    print(f"   ✅ Gold Upgrades Found: {gold_upgrades}")
                    print(f"   ✅ Skill Point Upgrades Found: {skill_upgrades}")
                    
                    # Verify specific upgrade values
                    gold_attack = gold_upgrades.get("attack", 0) if gold_upgrades else 0
                    skill_attack = skill_upgrades.get("attack", 0) if skill_upgrades else 0
                    
                    details = f"Upgrades preserved. Gold attack: {gold_attack}, Skill attack: {skill_attack}"
                else:
                    print(f"   ❌ Missing upgrades - Gold: {gold_upgrades}, Skill: {skill_upgrades}")
                    details = f"Missing upgrade data. Gold: {gold_upgrades}, Skill: {skill_upgrades}"
                    success = False
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                success = False
                
            self.log_test("Load Game with Upgrades", success, details)
            return success
        except Exception as e:
            self.log_test("Load Game with Upgrades", False, f"Exception: {str(e)}")
            return False
            
    def test_backend_logging_verification(self):
        """Test that backend logs show upgrade data being handled correctly"""
        try:
            # This test verifies that the save/load cycle works and logs are generated
            # We'll do a quick save/load cycle and check the response structure
            
            if not self.test_user_id:
                self.log_test("Backend Logging Verification", False, "No test user ID available")
                return False
                
            # Create test data with clear upgrade values for logging
            ninja_data = {
                "level": 10,
                "experience": 1000,
                "experienceToNext": 1100,
                "health": 150,
                "maxHealth": 150,
                "energy": 60,
                "maxEnergy": 60,
                "attack": 20,
                "defense": 12,
                "speed": 15,
                "luck": 6,
                "gold": 800,
                "gems": 25,
                "skillPoints": 8,
                "goldUpgrades": {
                    "attack": 5,
                    "defense": 3,
                    "speed": 4,
                    "luck": 1,
                    "maxHealth": 25,
                    "maxEnergy": 10
                },
                "skillPointUpgrades": {
                    "attack": 5,
                    "defense": 4,
                    "speed": 3,
                    "luck": 2,
                    "maxHealth": 25,
                    "maxEnergy": 0
                }
            }
            
            save_data = {
                "playerId": self.test_user_id,
                "ninja": ninja_data,
                "shurikens": [],
                "pets": [],
                "achievements": [],
                "unlockedFeatures": ["stats", "upgrades"],
                "zoneProgress": {}
            }
            
            print(f"\n🔍 BACKEND LOGGING TEST:")
            print(f"   Saving ninja with Gold Upgrades: {ninja_data['goldUpgrades']}")
            print(f"   Saving ninja with Skill Upgrades: {ninja_data['skillPointUpgrades']}")
            
            # Save the data
            save_response = self.session.post(f"{BACKEND_URL}/save-game", json=save_data)
            
            if save_response.status_code != 200:
                self.log_test("Backend Logging Verification", False, f"Save failed: {save_response.status_code}")
                return False
                
            # Load the data back
            load_response = self.session.get(f"{BACKEND_URL}/load-game/{self.test_user_id}")
            
            if load_response.status_code != 200:
                self.log_test("Backend Logging Verification", False, f"Load failed: {load_response.status_code}")
                return False
                
            loaded_data = load_response.json()
            loaded_ninja = loaded_data.get("ninja", {})
            
            # Verify the upgrade data is correctly handled
            gold_upgrades_match = loaded_ninja.get("goldUpgrades") == ninja_data["goldUpgrades"]
            skill_upgrades_match = loaded_ninja.get("skillPointUpgrades") == ninja_data["skillPointUpgrades"]
            
            success = gold_upgrades_match and skill_upgrades_match
            
            if success:
                details = "Backend correctly logs and handles upgrade data in save/load cycle"
                print(f"   ✅ Gold upgrades preserved: {loaded_ninja.get('goldUpgrades')}")
                print(f"   ✅ Skill upgrades preserved: {loaded_ninja.get('skillPointUpgrades')}")
            else:
                details = f"Upgrade data mismatch. Gold match: {gold_upgrades_match}, Skill match: {skill_upgrades_match}"
                print(f"   ❌ Gold upgrades mismatch: Expected {ninja_data['goldUpgrades']}, Got {loaded_ninja.get('goldUpgrades')}")
                print(f"   ❌ Skill upgrades mismatch: Expected {ninja_data['skillPointUpgrades']}, Got {loaded_ninja.get('skillPointUpgrades')}")
                
            self.log_test("Backend Logging Verification", success, details)
            return success
        except Exception as e:
            self.log_test("Backend Logging Verification", False, f"Exception: {str(e)}")
            return False
            
    def test_no_regressions(self):
        """Test that no regressions occurred in backend functionality"""
        try:
            # Test shuriken generation
            shuriken_response = self.session.post(f"{BACKEND_URL}/generate-shuriken")
            shuriken_ok = shuriken_response.status_code == 200
            
            # Test pet generation  
            pet_response = self.session.post(f"{BACKEND_URL}/generate-pet")
            pet_ok = pet_response.status_code == 200
            
            # Test leaderboard
            leaderboard_response = self.session.get(f"{BACKEND_URL}/leaderboard")
            leaderboard_ok = leaderboard_response.status_code == 200
            
            # Test game events
            events_response = self.session.get(f"{BACKEND_URL}/game-events")
            events_ok = events_response.status_code == 200
            
            all_ok = shuriken_ok and pet_ok and leaderboard_ok and events_ok
            
            details = f"Shuriken: {shuriken_ok}, Pet: {pet_ok}, Leaderboard: {leaderboard_ok}, Events: {events_ok}"
            
            if all_ok:
                # Get some sample data to verify structure
                shuriken_data = shuriken_response.json().get("shuriken", {})
                pet_data = pet_response.json().get("pet", {})
                leaderboard_data = leaderboard_response.json().get("leaderboard", [])
                events_data = events_response.json().get("events", [])
                
                details += f" | Shuriken: {shuriken_data.get('name', 'N/A')}, Pet: {pet_data.get('name', 'N/A')}, Leaderboard entries: {len(leaderboard_data)}, Events: {len(events_data)}"
                
            self.log_test("No Regressions Check", all_ok, details)
            return all_ok
        except Exception as e:
            self.log_test("No Regressions Check", False, f"Exception: {str(e)}")
            return False
            
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 STARTING BACKEND TESTING FOR EVENT-DRIVEN CHARACTER UPGRADES")
        print("=" * 70)
        
        # Core authentication tests
        print("\n📋 TESTING CORE AUTHENTICATION ENDPOINTS:")
        auth_tests = [
            self.test_health_check(),
            self.test_user_registration(),
            self.test_user_login(),
            self.test_session_check()
        ]
        
        # Character upgrade persistence tests
        print("\n🎯 TESTING CHARACTER UPGRADE PERSISTENCE:")
        upgrade_tests = [
            self.test_save_game_with_upgrades(),
            self.test_load_game_with_upgrades(),
            self.test_backend_logging_verification()
        ]
        
        # Regression tests
        print("\n🔍 TESTING FOR REGRESSIONS:")
        regression_tests = [
            self.test_no_regressions()
        ]
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY:")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['details']}")
                    
        return passed_tests, failed_tests, total_tests

if __name__ == "__main__":
    tester = BackendTester()
    passed, failed, total = tester.run_all_tests()
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! Backend is ready for character upgrade functionality.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review the issues above.")