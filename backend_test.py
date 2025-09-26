#!/usr/bin/env python3
"""
Comprehensive Backend API Testing Suite
Tests all critical endpoints for the Mythic-Tech Idle RPG backend after URL configuration and authentication fixes.

FOCUS AREAS (as per review request):
1. API connectivity and CORS configuration
2. Authentication flows (registration, login, session check)
3. Game data persistence (save/load operations)
4. All existing game systems functionality

Previous issues resolved:
- Fixed URL mismatch between frontend (.env) and backend CORS configuration
- Updated authentication loading with timeout mechanism
- Backend should now be fully functional with all endpoints working
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration - Use correct URL from frontend/.env
BASE_URL = "https://mythic-ninja-save.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"ninja_master_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "SecureNinja123!"
TEST_USER_NAME = "Ninja Master Tester"

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

    def test_cors_configuration(self):
        """Test CORS headers are properly configured for frontend origins"""
        print("\n=== TESTING CORS CONFIGURATION ===")
        
        try:
            # Test preflight request with frontend origin
            frontend_origin = "https://ninja-idle-fix.preview.emergentagent.com"
            headers = {
                'Origin': frontend_origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = self.session.options(f"{BASE_URL}/auth/register", headers=headers)
            
            print(f"CORS Preflight Status: {response.status_code}")
            print(f"CORS Headers: {dict(response.headers)}")
            
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            cors_credentials = response.headers.get('Access-Control-Allow-Credentials')
            
            # Check if CORS is properly configured (not wildcard with credentials)
            if cors_origin and cors_origin != '*':
                if cors_credentials and cors_credentials.lower() == 'true':
                    self.log_result("authentication", "CORS Configuration", True, 
                                  f"CORS properly configured - Origin: {cors_origin}, Credentials: {cors_credentials}")
                    return True
                else:
                    self.log_result("authentication", "CORS Configuration", False, 
                                  f"CORS credentials not enabled: {cors_credentials}")
                    return False
            else:
                self.log_result("authentication", "CORS Configuration", False, 
                              f"CORS using wildcard origin (incompatible with credentials): {cors_origin}")
                return False
                
        except Exception as e:
            self.log_result("authentication", "CORS Configuration", False, f"Exception: {str(e)}")
            return False

    def test_user_registration(self):
        """Test user registration endpoint with CORS headers"""
        print("\n=== TESTING USER REGISTRATION WITH CORS ===")
        
        try:
            registration_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            }
            
            # Include CORS headers to simulate frontend request
            headers = {
                'Content-Type': 'application/json',
                'Origin': 'https://ninja-idle-fix.preview.emergentagent.com'
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/register", 
                json=registration_data,
                headers=headers
            )
            
            print(f"Registration Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 201:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.test_user_id = data["user"]["id"]
                    self.session_cookies = response.cookies
                    
                    # Check CORS headers in response
                    cors_origin = response.headers.get('Access-Control-Allow-Origin')
                    cors_credentials = response.headers.get('Access-Control-Allow-Credentials')
                    
                    cors_msg = f"CORS Origin: {cors_origin}, Credentials: {cors_credentials}"
                    self.log_result("authentication", "User Registration", True, 
                                  f"User created successfully with ID: {self.test_user_id}. {cors_msg}")
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

    def test_user_login(self):
        """Test user login endpoint with CORS headers"""
        print("\n=== TESTING USER LOGIN WITH CORS ===")
        
        try:
            login_data = {
                "username": TEST_USER_EMAIL,  # OAuth2PasswordRequestForm uses 'username'
                "password": TEST_USER_PASSWORD
            }
            
            # Include CORS headers to simulate frontend request
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://ninja-idle-fix.preview.emergentagent.com'
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/login", 
                data=login_data,
                headers=headers
            )
            
            print(f"Login Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.session_cookies = response.cookies
                    
                    # Check CORS headers in response
                    cors_origin = response.headers.get('Access-Control-Allow-Origin')
                    cors_credentials = response.headers.get('Access-Control-Allow-Credentials')
                    
                    cors_msg = f"CORS Origin: {cors_origin}, Credentials: {cors_credentials}"
                    self.log_result("authentication", "User Login", True, 
                                  f"Login successful for user: {data['user']['email']}. {cors_msg}")
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
        """Print comprehensive test summary focused on CORS and authentication"""
        print("\n" + "="*80)
        print("BACKEND AUTHENTICATION SYSTEM - CORS & AUTHENTICATION TEST SUMMARY")
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
            print("\n🎯 CORS & AUTHENTICATION SYSTEM WORKING CORRECTLY!")
            print("✅ Health check endpoint responding")
            print("✅ CORS properly configured for frontend origins")
            print("✅ Registration flow working with credentials")
            print("✅ Login flow working with credentials")
            print("✅ Session management functional")
            print("✅ Authentication system ready for frontend integration")
        else:
            print(f"\n⚠️  {total_failed} AUTHENTICATION/CORS ISSUES NEED ATTENTION")
            print("❌ Frontend authentication may be blocked by CORS policy")
        
        print("="*80)

    def run_all_tests(self):
        """Run CORS and authentication focused tests"""
        print("🚀 Starting Backend Authentication System Tests - CORS & Authentication Focus...")
        print(f"Base URL: {BASE_URL}")
        print(f"Test User: {TEST_USER_EMAIL}")
        print(f"Focus: Health Check + CORS Configuration + Authentication Flow")
        
        test_results = []
        
        # Core authentication and CORS tests (as per review request)
        test_results.append(self.test_health_check())
        test_results.append(self.test_cors_configuration())
        test_results.append(self.test_user_registration())
        test_results.append(self.test_user_login())
        test_results.append(self.test_session_check())
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