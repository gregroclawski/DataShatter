#!/usr/bin/env python3
"""
Backend API Testing for Idle Ninja Online - Progress Persistence Fix Verification
Tests authentication and game progression endpoints to verify they're working for the progress persistence fix.

Focus areas:
1. Authentication endpoints (/api/auth/login, /api/auth/register)
2. Game save/load endpoints (/api/save-game, /api/load-game)  
3. Session management (/api/auth/session/check)
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://ninja-ui-debug.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"ninja_master_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "SecureNinja123!"
TEST_USER_NAME = "Ninja Master Tester"

class ProgressPersistenceTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.session_cookies = None
        self.test_user_id = None
        self.results = {
            "authentication": {"passed": 0, "failed": 0, "details": []},
            "game_progression": {"passed": 0, "failed": 0, "details": []},
            "session_management": {"passed": 0, "failed": 0, "details": []},
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

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== TESTING USER REGISTRATION ===")
        
        try:
            registration_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=registration_data)
            
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
                self.log_result("authentication", "User Registration", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("authentication", "User Registration", False, f"Exception: {str(e)}")
            return False

    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== TESTING USER LOGIN ===")
        
        try:
            login_data = {
                "username": TEST_USER_EMAIL,  # OAuth2PasswordRequestForm uses 'username'
                "password": TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", data=login_data)
            
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
                self.log_result("authentication", "User Login", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("authentication", "User Login", False, f"Exception: {str(e)}")
            return False

    def test_session_check(self):
        """Test session validation endpoint"""
        print("\n=== TESTING SESSION CHECK ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/auth/session/check", cookies=self.session_cookies)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("authenticated") == True and "user" in data:
                    self.log_result("session_management", "Session Check", True, 
                                  f"Session valid for user: {data['user']['email']}")
                    return True
                else:
                    self.log_result("session_management", "Session Check", False, 
                                  f"Unexpected session check response: {data}")
                    return False
            else:
                self.log_result("session_management", "Session Check", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("session_management", "Session Check", False, f"Exception: {str(e)}")
            return False

    def test_save_game_high_level(self):
        """Test saving high-level game progression data (Level 18+ scenario)"""
        print("\n=== TESTING SAVE GAME (HIGH LEVEL) ===")
        
        try:
            # Create realistic high-level ninja data (Level 18 as mentioned in user report)
            high_level_save_data = {
                "playerId": self.test_user_id,
                "ninja": {
                    "level": 18,
                    "experience": 3240,
                    "experienceToNext": 1900,
                    "health": 180,
                    "maxHealth": 180,
                    "energy": 90,
                    "maxEnergy": 90,
                    "attack": 36,
                    "defense": 18,
                    "speed": 27,
                    "luck": 11,
                    "gold": 8500,
                    "gems": 245,
                    "skillPoints": 54
                },
                "shurikens": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Dragon Fang",
                        "rarity": "epic",
                        "attack": 35,
                        "level": 8,
                        "equipped": True
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Silver Star",
                        "rarity": "rare",
                        "attack": 22,
                        "level": 5,
                        "equipped": False
                    }
                ],
                "pets": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Epic Dragon",
                        "type": "Dragon",
                        "level": 12,
                        "experience": 1440,
                        "happiness": 85,
                        "strength": 28,
                        "active": True,
                        "rarity": "epic"
                    }
                ],
                "achievements": [
                    "first_kill", "level_10", "rare_shuriken", "pet_master", "zone_explorer"
                ],
                "unlockedFeatures": [
                    "stats", "shurikens", "pets", "achievements", "leaderboard"
                ],
                "zoneProgress": {
                    "forest": {"completed": True, "kills": 50, "boss_defeated": True},
                    "desert": {"completed": True, "kills": 75, "boss_defeated": True},
                    "mountains": {"completed": False, "kills": 23, "boss_defeated": False}
                }
            }
            
            response = self.session.post(
                f"{BASE_URL}/save-game",
                json=high_level_save_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("ninja", {}).get("level") == 18 and 
                    data.get("ninja", {}).get("experience") == 3240):
                    self.log_result("game_progression", "Save Game (Level 18)", True, 
                                  f"Saved Level {data['ninja']['level']} ninja with {data['ninja']['experience']} XP and {data['ninja']['skillPoints']} skill points")
                    return True
                else:
                    self.log_result("game_progression", "Save Game (Level 18)", False, 
                                  f"Data mismatch in saved game: {data}")
                    return False
            else:
                self.log_result("game_progression", "Save Game (Level 18)", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Save Game (Level 18)", False, f"Exception: {str(e)}")
            return False

    def test_load_game(self):
        """Test loading saved game data"""
        print("\n=== TESTING LOAD GAME ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/load-game/{self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data and data.get("ninja", {}).get("level") == 18:
                    ninja_data = data["ninja"]
                    zone_progress = data.get("zoneProgress", {})
                    self.log_result("game_progression", "Load Game", True, 
                                  f"Loaded Level {ninja_data['level']} ninja with {ninja_data['experience']} XP, "
                                  f"{ninja_data['gold']} gold, {ninja_data['skillPoints']} skill points, "
                                  f"zone progress: {len(zone_progress)} zones")
                    return True
                elif data is None:
                    self.log_result("game_progression", "Load Game", False, "No saved game found")
                    return False
                else:
                    self.log_result("game_progression", "Load Game", False, f"Unexpected data: {data}")
                    return False
            else:
                self.log_result("game_progression", "Load Game", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Load Game", False, f"Exception: {str(e)}")
            return False

    def test_extreme_level_progression(self):
        """Test extreme level values for robust progression support"""
        print("\n=== TESTING EXTREME LEVEL PROGRESSION ===")
        
        try:
            extreme_save_data = {
                "playerId": self.test_user_id,
                "ninja": {
                    "level": 999,
                    "experience": 999999,
                    "experienceToNext": 100000,
                    "health": 9990,
                    "maxHealth": 9990,
                    "energy": 4995,
                    "maxEnergy": 4995,
                    "attack": 1998,
                    "defense": 999,
                    "speed": 1497,
                    "luck": 599,
                    "gold": 9999999,
                    "gems": 99999,
                    "skillPoints": 2997
                },
                "shurikens": [],
                "pets": [],
                "achievements": [],
                "unlockedFeatures": ["stats"],
                "zoneProgress": {}
            }
            
            # Save extreme data
            save_response = self.session.post(
                f"{BASE_URL}/save-game",
                json=extreme_save_data,
                headers={"Content-Type": "application/json"}
            )
            
            if save_response.status_code != 200:
                self.log_result("game_progression", "Extreme Level Save", False, 
                              f"Save failed: {save_response.status_code}")
                return False
            
            # Load and verify extreme data
            load_response = self.session.get(f"{BASE_URL}/load-game/{self.test_user_id}")
            
            if load_response.status_code == 200:
                data = load_response.json()
                ninja = data.get("ninja", {})
                if (ninja.get("level") == 999 and 
                    ninja.get("experience") == 999999 and 
                    ninja.get("skillPoints") == 2997):
                    self.log_result("game_progression", "Extreme Level Progression", True, 
                                  f"Successfully handled Level {ninja['level']} with {ninja['experience']} XP")
                    return True
                else:
                    self.log_result("game_progression", "Extreme Level Progression", False, 
                                  f"Data integrity issue: {ninja}")
                    return False
            else:
                self.log_result("game_progression", "Extreme Level Progression", False, 
                              f"Load failed: {load_response.status_code}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Extreme Level Progression", False, f"Exception: {str(e)}")
            return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        print("\n=== TESTING INVALID LOGIN ===")
        
        try:
            invalid_login_data = {
                "username": "nonexistent@example.com",
                "password": "wrongpassword"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", data=invalid_login_data)
            
            if response.status_code == 401:
                self.log_result("authentication", "Invalid Login Test", True, "Correctly rejected invalid credentials")
                return True
            else:
                self.log_result("authentication", "Invalid Login Test", False, 
                              f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("authentication", "Invalid Login Test", False, f"Exception: {str(e)}")
            return False

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("PROGRESS PERSISTENCE FIX VERIFICATION - TEST SUMMARY")
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
            print("\n🎯 BACKEND READY FOR FRONTEND INTEGRATION!")
            print("All authentication and game progression endpoints are working correctly.")
        else:
            print(f"\n⚠️  {total_failed} ISSUES NEED ATTENTION BEFORE FRONTEND INTEGRATION")
        
        print("="*80)

    def run_all_tests(self):
        """Run all progress persistence tests"""
        print("🚀 Starting Progress Persistence Fix Verification Tests...")
        print(f"Base URL: {BASE_URL}")
        print(f"Test User: {TEST_USER_EMAIL}")
        print(f"Focus: Authentication + Game Save/Load + Session Management")
        
        test_results = []
        
        # Authentication flow tests
        test_results.append(self.test_user_registration())
        test_results.append(self.test_user_login())
        test_results.append(self.test_session_check())
        
        # Game progression tests (core focus)
        test_results.append(self.test_save_game_high_level())
        test_results.append(self.test_load_game())
        test_results.append(self.test_extreme_level_progression())
        
        # Security validation
        test_results.append(self.test_invalid_login())
        
        # Print summary
        self.print_summary()
        
        return all(test_results)

def main():
    """Main test execution"""
    tester = ProgressPersistenceTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()