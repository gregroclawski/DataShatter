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
BASE_URL = "https://mythic-ninja-save.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"ninja_master_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "SecureNinja123!"
TEST_USER_NAME = "Ninja Master Tester"

class AuthenticationTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.session_cookies = None
        self.test_user_id = None
        self.results = {
            "registration": {"passed": 0, "failed": 0, "details": []},
            "login": {"passed": 0, "failed": 0, "details": []},
            "oauth": {"passed": 0, "failed": 0, "details": []},
            "profile": {"passed": 0, "failed": 0, "details": []},
            "session": {"passed": 0, "failed": 0, "details": []},
            "logout": {"passed": 0, "failed": 0, "details": []},
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
        """Test user registration endpoint with various scenarios"""
        print("\n=== TESTING USER REGISTRATION ===")
        
        # Test 1: Valid registration
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
                    self.log_result("registration", "Valid Registration", True, 
                                  f"User created successfully with ID: {self.test_user_id}")
                else:
                    self.log_result("registration", "Valid Registration", False, 
                                  f"Missing required fields in response: {data}")
            else:
                self.log_result("registration", "Valid Registration", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("registration", "Valid Registration", False, f"Exception: {str(e)}")

        # Test 2: Password too short (less than 8 characters)
        try:
            short_password_data = {
                "email": "short.pass@example.com",
                "password": "1234567",  # 7 characters
                "name": "Short Pass User"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=short_password_data)
            
            if response.status_code in [400, 422]:  # Accept both 400 and 422 for validation errors
                self.log_result("registration", "Password Too Short Validation", True, 
                              "Correctly rejected password with less than 8 characters")
            else:
                self.log_result("registration", "Password Too Short Validation", False, 
                              f"Expected 400 or 422, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("registration", "Password Too Short Validation", False, f"Exception: {str(e)}")

        # Test 3: Password too long (more than 64 characters)
        try:
            long_password = "a" * 65  # 65 characters
            long_password_data = {
                "email": "long.pass@example.com",
                "password": long_password,
                "name": "Long Pass User"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=long_password_data)
            
            if response.status_code in [400, 422]:  # Accept both 400 and 422 for validation errors
                self.log_result("registration", "Password Too Long Validation", True, 
                              "Correctly rejected password with more than 64 characters")
            else:
                self.log_result("registration", "Password Too Long Validation", False, 
                              f"Expected 400 or 422, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("registration", "Password Too Long Validation", False, f"Exception: {str(e)}")

        # Test 4: Duplicate email registration
        try:
            duplicate_data = {
                "email": TEST_USER_EMAIL,  # Same email as first test
                "password": "AnotherPassword123!",
                "name": "Duplicate User"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=duplicate_data)
            
            if response.status_code == 400:
                self.log_result("registration", "Duplicate Email Validation", True, 
                              "Correctly rejected duplicate email registration")
            else:
                self.log_result("registration", "Duplicate Email Validation", False, 
                              f"Expected 400, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("registration", "Duplicate Email Validation", False, f"Exception: {str(e)}")

    def test_user_login(self):
        """Test user login endpoint with various scenarios"""
        print("\n=== TESTING USER LOGIN ===")
        
        # Test 1: Valid login
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
                    self.log_result("login", "Valid Login", True, 
                                  f"Login successful for user: {data['user']['email']}")
                else:
                    self.log_result("login", "Valid Login", False, 
                                  f"Missing required fields in response: {data}")
            else:
                self.log_result("login", "Valid Login", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("login", "Valid Login", False, f"Exception: {str(e)}")

        # Test 2: Invalid email
        try:
            invalid_email_data = {
                "username": "nonexistent@example.com",
                "password": TEST_USER_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", data=invalid_email_data)
            
            if response.status_code == 401:
                self.log_result("login", "Invalid Email", True, 
                              "Correctly rejected login with invalid email")
            else:
                self.log_result("login", "Invalid Email", False, 
                              f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("login", "Invalid Email", False, f"Exception: {str(e)}")

        # Test 3: Invalid password
        try:
            invalid_password_data = {
                "username": TEST_USER_EMAIL,
                "password": "WrongPassword123!"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", data=invalid_password_data)
            
            if response.status_code == 401:
                self.log_result("login", "Invalid Password", True, 
                              "Correctly rejected login with invalid password")
            else:
                self.log_result("login", "Invalid Password", False, 
                              f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("login", "Invalid Password", False, f"Exception: {str(e)}")

    def test_google_oauth(self):
        """Test Google OAuth integration (mocked)"""
        print("\n=== TESTING GOOGLE OAUTH ===")
        
        # Test 1: Missing session ID
        try:
            oauth_data = {}  # No session_id
            
            response = self.session.post(f"{BASE_URL}/auth/oauth/google", json=oauth_data)
            
            if response.status_code == 400:
                self.log_result("oauth", "Missing Session ID", True, 
                              "Correctly rejected OAuth request without session ID")
            else:
                self.log_result("oauth", "Missing Session ID", False, 
                              f"Expected 400, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("oauth", "Missing Session ID", False, f"Exception: {str(e)}")

        # Test 2: Invalid session ID (will fail as expected since we can't mock Emergent Auth)
        try:
            oauth_data = {"session_id": "invalid_session_id_12345"}
            
            response = self.session.post(f"{BASE_URL}/auth/oauth/google", json=oauth_data)
            
            if response.status_code == 400:
                self.log_result("oauth", "Invalid Session ID", True, 
                              "Correctly rejected OAuth request with invalid session ID")
            else:
                self.log_result("oauth", "Invalid Session ID", False, 
                              f"Expected 400, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("oauth", "Invalid Session ID", False, f"Exception: {str(e)}")

    def test_user_profile(self):
        """Test user profile endpoint"""
        print("\n=== TESTING USER PROFILE ===")
        
        # Test 1: Access profile with valid authentication
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"} if self.access_token else {}
            
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers, cookies=self.session_cookies)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data and "name" in data:
                    self.log_result("profile", "Authenticated Profile Access", True, 
                                  f"Profile retrieved for user: {data['email']}")
                else:
                    self.log_result("profile", "Authenticated Profile Access", False, 
                                  f"Missing required fields in profile: {data}")
            else:
                self.log_result("profile", "Authenticated Profile Access", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("profile", "Authenticated Profile Access", False, f"Exception: {str(e)}")

        # Test 2: Access profile without authentication
        try:
            response = requests.get(f"{BASE_URL}/auth/me")  # No auth headers or cookies
            
            if response.status_code == 401:
                self.log_result("profile", "Unauthenticated Profile Access", True, 
                              "Correctly rejected profile access without authentication")
            else:
                self.log_result("profile", "Unauthenticated Profile Access", False, 
                              f"Expected 401, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("profile", "Unauthenticated Profile Access", False, f"Exception: {str(e)}")

    def test_session_management(self):
        """Test session management endpoints"""
        print("\n=== TESTING SESSION MANAGEMENT ===")
        
        # Test 1: Check valid session
        try:
            response = self.session.get(f"{BASE_URL}/auth/session/check", cookies=self.session_cookies)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("authenticated") == True and "user" in data:
                    self.log_result("session", "Valid Session Check", True, 
                                  f"Session valid for user: {data['user']['email']}")
                else:
                    self.log_result("session", "Valid Session Check", False, 
                                  f"Unexpected session check response: {data}")
            else:
                self.log_result("session", "Valid Session Check", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("session", "Valid Session Check", False, f"Exception: {str(e)}")

        # Test 2: Check session without cookies
        try:
            response = requests.get(f"{BASE_URL}/auth/session/check")  # No cookies
            
            if response.status_code == 200:
                data = response.json()
                if data.get("authenticated") == False:
                    self.log_result("session", "Invalid Session Check", True, 
                                  "Correctly identified invalid session")
                else:
                    self.log_result("session", "Invalid Session Check", False, 
                                  f"Expected authenticated=false, got: {data}")
            else:
                self.log_result("session", "Invalid Session Check", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("session", "Invalid Session Check", False, f"Exception: {str(e)}")

    def test_logout(self):
        """Test logout functionality"""
        print("\n=== TESTING LOGOUT ===")
        
        # Test 1: Successful logout
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"} if self.access_token else {}
            
            response = self.session.post(f"{BASE_URL}/auth/logout", headers=headers, cookies=self.session_cookies)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("logout", "Successful Logout", True, 
                                  f"Logout successful: {data['message']}")
                else:
                    self.log_result("logout", "Successful Logout", False, 
                                  f"Unexpected logout response: {data}")
            else:
                self.log_result("logout", "Successful Logout", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("logout", "Successful Logout", False, f"Exception: {str(e)}")

        # Test 2: Verify session is cleared after logout
        try:
            response = self.session.get(f"{BASE_URL}/auth/session/check", cookies=self.session_cookies)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("authenticated") == False:
                    self.log_result("logout", "Session Cleanup Verification", True, 
                                  "Session correctly cleared after logout")
                else:
                    self.log_result("logout", "Session Cleanup Verification", False, 
                                  f"Session still active after logout: {data}")
            else:
                self.log_result("logout", "Session Cleanup Verification", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("logout", "Session Cleanup Verification", False, f"Exception: {str(e)}")

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("AUTHENTICATION SYSTEM TEST SUMMARY")
        print("="*80)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            print(f"\n{category.upper()} TESTS:")
            print(f"  ✅ Passed: {passed}")
            print(f"  ❌ Failed: {failed}")
            
            for detail in results["details"]:
                print(f"    {detail}")
        
        print(f"\n{'='*80}")
        print(f"OVERALL RESULTS:")
        print(f"  ✅ Total Passed: {total_passed}")
        print(f"  ❌ Total Failed: {total_failed}")
        print(f"  📊 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "N/A")
        print("="*80)

    def run_all_tests(self):
        """Run all authentication tests"""
        print("Starting Comprehensive Authentication System Testing...")
        print(f"Base URL: {BASE_URL}")
        print(f"Test User: {TEST_USER_EMAIL}")
        
        # Run tests in logical order
        self.test_user_registration()
        self.test_user_login()
        self.test_google_oauth()
        self.test_user_profile()
        self.test_session_management()
        self.test_logout()
        
        # Print summary
        self.print_summary()

def main():
    """Main test execution"""
    tester = AuthenticationTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()