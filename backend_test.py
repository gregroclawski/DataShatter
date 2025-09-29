#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Name Change Functionality
Testing all name change logic, authentication, and database persistence
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://idle-ninja-game.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.test_users = []
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session with proper headers"""
        self.session = aiohttp.ClientSession(
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=aiohttp.ClientTimeout(total=30)
        )
    
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
    
    async def register_test_user(self, email: str, password: str, name: str) -> Optional[Dict[str, Any]]:
        """Register a test user and return auth data"""
        try:
            payload = {
                "email": email,
                "password": password,
                "name": name
            }
            
            async with self.session.post(f"{API_BASE}/auth/register", json=payload) as response:
                if response.status == 201:
                    data = await response.json()
                    user_data = {
                        'user': data['user'],
                        'token': data['access_token'],
                        'email': email,
                        'password': password,
                        'name': name
                    }
                    self.test_users.append(user_data)
                    return user_data
                else:
                    error_text = await response.text()
                    print(f"Registration failed for {email}: {response.status} - {error_text}")
                    return None
        except Exception as e:
            print(f"Registration error for {email}: {str(e)}")
            return None
    
    async def login_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Login user and return auth data"""
        try:
            # Use form data for OAuth2PasswordRequestForm
            form_data = aiohttp.FormData()
            form_data.add_field('username', email)  # OAuth2 uses 'username' field
            form_data.add_field('password', password)
            
            async with self.session.post(f"{API_BASE}/auth/login", data=form_data) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        'user': data['user'],
                        'token': data['access_token'],
                        'email': email,
                        'password': password
                    }
                else:
                    error_text = await response.text()
                    print(f"Login failed for {email}: {response.status} - {error_text}")
                    return None
        except Exception as e:
            print(f"Login error for {email}: {str(e)}")
            return None
    
    async def make_authenticated_request(self, method: str, endpoint: str, user_data: Dict[str, Any], payload: Dict[str, Any] = None) -> tuple:
        """Make authenticated request"""
        try:
            headers = {
                'Authorization': f"Bearer {user_data['token']}",
                'Content-Type': 'application/json'
            }
            
            url = f"{API_BASE}{endpoint}"
            
            if method.upper() == 'GET':
                async with self.session.get(url, headers=headers) as response:
                    return response.status, await response.json()
            elif method.upper() == 'POST':
                async with self.session.post(url, headers=headers, json=payload) as response:
                    return response.status, await response.json()
            else:
                raise ValueError(f"Unsupported method: {method}")
                
        except Exception as e:
            print(f"Request error: {str(e)}")
            return 500, {"error": str(e)}
    
    async def test_health_check(self):
        """Test basic API health"""
        try:
            async with self.session.get(f"{API_BASE}/") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Health Check", True, f"API responding: {data.get('message', 'OK')}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Status: {response.status}")
                    return False
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False
    
    async def test_user_registration_and_auth(self):
        """Test user registration for name change testing"""
        print("\n🔐 TESTING USER REGISTRATION & AUTHENTICATION")
        
        # Test user 1 - will be used for basic name change tests
        user1 = await self.register_test_user(
            "nametest1@example.com", 
            "testpass123", 
            "TestUser1"
        )
        
        if user1:
            self.log_test("User Registration (TestUser1)", True, f"User ID: {user1['user']['id']}")
        else:
            self.log_test("User Registration (TestUser1)", False, "Failed to register")
            return False
        
        # Test user 2 - will be used for name conflict tests
        user2 = await self.register_test_user(
            "nametest2@example.com", 
            "testpass123", 
            "TestUser2"
        )
        
        if user2:
            self.log_test("User Registration (TestUser2)", True, f"User ID: {user2['user']['id']}")
        else:
            self.log_test("User Registration (TestUser2)", False, "Failed to register")
            return False
        
        return True
    
    async def test_name_change_info_endpoint(self):
        """Test name change info endpoint"""
        print("\n📋 TESTING NAME CHANGE INFO ENDPOINT")
        
        if not self.test_users:
            self.log_test("Name Change Info", False, "No test users available")
            return False
        
        user = self.test_users[0]
        status, data = await self.make_authenticated_request('GET', '/user/name-change-info', user)
        
        if status == 200:
            expected_fields = ['current_name', 'name_changes_used', 'next_change_free', 'next_change_cost']
            if all(field in data for field in expected_fields):
                self.log_test("Name Change Info Endpoint", True, 
                             f"Current: {data['current_name']}, Changes used: {data['name_changes_used']}, Next free: {data['next_change_free']}, Cost: ${data['next_change_cost']}")
                return True
            else:
                self.log_test("Name Change Info Endpoint", False, f"Missing fields in response: {data}")
                return False
        else:
            self.log_test("Name Change Info Endpoint", False, f"Status: {status}, Response: {data}")
            return False
    
    async def test_free_name_change(self):
        """Test free name change (first change)"""
        print("\n🆓 TESTING FREE NAME CHANGE")
        
        if not self.test_users:
            self.log_test("Free Name Change", False, "No test users available")
            return False
        
        user = self.test_users[0]
        original_name = user['name']
        new_name = "FreeChangeUser"
        
        payload = {
            "new_name": new_name,
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user, payload)
        
        if status == 200:
            if (data.get('success') and 
                data.get('new_name') == new_name and 
                data.get('was_free') == True and 
                data.get('cost') == 0.0):
                
                # Update user data for future tests
                user['name'] = new_name
                user['user']['name'] = new_name
                
                self.log_test("Free Name Change", True, 
                             f"Changed from '{original_name}' to '{new_name}' (Free)")
                return True
            else:
                self.log_test("Free Name Change", False, f"Unexpected response: {data}")
                return False
        else:
            self.log_test("Free Name Change", False, f"Status: {status}, Response: {data}")
            return False
    
    async def test_paid_name_change(self):
        """Test paid name change (subsequent changes)"""
        print("\n💰 TESTING PAID NAME CHANGE")
        
        if not self.test_users:
            self.log_test("Paid Name Change", False, "No test users available")
            return False
        
        user = self.test_users[0]
        original_name = user['name']
        new_name = "PaidChangeUser"
        
        payload = {
            "new_name": new_name,
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user, payload)
        
        if status == 200:
            if (data.get('success') and 
                data.get('new_name') == new_name and 
                data.get('was_free') == False and 
                data.get('cost') == 6.99):
                
                # Update user data for future tests
                user['name'] = new_name
                user['user']['name'] = new_name
                
                self.log_test("Paid Name Change", True, 
                             f"Changed from '{original_name}' to '{new_name}' ($6.99)")
                return True
            else:
                self.log_test("Paid Name Change", False, f"Unexpected response: {data}")
                return False
        else:
            self.log_test("Paid Name Change", False, f"Status: {status}, Response: {data}")
            return False
    
    async def test_name_availability_logic(self):
        """Test name availability and conflict detection"""
        print("\n🔍 TESTING NAME AVAILABILITY LOGIC")
        
        if len(self.test_users) < 2:
            self.log_test("Name Availability Logic", False, "Need at least 2 test users")
            return False
        
        user1 = self.test_users[0]
        user2 = self.test_users[1]
        
        # Test 1: Try to take a name that's currently in use
        payload = {
            "new_name": user2['name'],  # Try to take user2's name
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user1, payload)
        
        if status == 400 and "already taken" in data.get('detail', '').lower():
            self.log_test("Name Conflict Detection", True, 
                         f"Correctly prevented taking existing name '{user2['name']}'")
        else:
            self.log_test("Name Conflict Detection", False, 
                         f"Should have prevented name conflict. Status: {status}, Response: {data}")
            return False
        
        # Test 2: Change user2's name to make their old name available
        old_user2_name = user2['name']
        new_user2_name = "AvailabilityTestUser"
        
        payload = {
            "new_name": new_user2_name,
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user2, payload)
        
        if status == 200:
            user2['name'] = new_user2_name
            user2['user']['name'] = new_user2_name
            self.log_test("Name Release", True, f"User2 changed to '{new_user2_name}', releasing '{old_user2_name}'")
        else:
            self.log_test("Name Release", False, f"Failed to change user2 name: {data}")
            return False
        
        # Test 3: Now user1 should be able to take the released name
        payload = {
            "new_name": old_user2_name,
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user1, payload)
        
        if status == 200 and data.get('new_name') == old_user2_name:
            user1['name'] = old_user2_name
            user1['user']['name'] = old_user2_name
            self.log_test("Name Reuse After Release", True, 
                         f"User1 successfully took released name '{old_user2_name}'")
            return True
        else:
            self.log_test("Name Reuse After Release", False, 
                         f"Failed to take released name. Status: {status}, Response: {data}")
            return False
    
    async def test_case_insensitive_name_checking(self):
        """Test case-insensitive name checking"""
        print("\n🔤 TESTING CASE-INSENSITIVE NAME CHECKING")
        
        if len(self.test_users) < 2:
            self.log_test("Case Insensitive Checking", False, "Need at least 2 test users")
            return False
        
        user1 = self.test_users[0]
        user2 = self.test_users[1]
        
        # Try to take user2's name with different case
        user2_name_upper = user2['name'].upper()
        
        payload = {
            "new_name": user2_name_upper,
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user1, payload)
        
        if status == 400 and "already taken" in data.get('detail', '').lower():
            self.log_test("Case Insensitive Name Conflict", True, 
                         f"Correctly prevented taking '{user2_name_upper}' (case variant of '{user2['name']}')")
            return True
        else:
            self.log_test("Case Insensitive Name Conflict", False, 
                         f"Should have prevented case-insensitive conflict. Status: {status}, Response: {data}")
            return False
    
    async def test_same_name_prevention(self):
        """Test prevention of changing to same name"""
        print("\n🚫 TESTING SAME NAME PREVENTION")
        
        if not self.test_users:
            self.log_test("Same Name Prevention", False, "No test users available")
            return False
        
        user = self.test_users[0]
        current_name = user['name']
        
        # Test 1: Try exact same name
        payload = {
            "new_name": current_name,
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user, payload)
        
        if status == 400 and "different from current" in data.get('detail', '').lower():
            self.log_test("Same Name Prevention (Exact)", True, 
                         f"Correctly prevented changing to same name '{current_name}'")
        else:
            self.log_test("Same Name Prevention (Exact)", False, 
                         f"Should have prevented same name change. Status: {status}, Response: {data}")
            return False
        
        # Test 2: Try same name with different case
        same_name_different_case = current_name.lower() if current_name.isupper() else current_name.upper()
        
        payload = {
            "new_name": same_name_different_case,
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', user, payload)
        
        if status == 400 and "different from current" in data.get('detail', '').lower():
            self.log_test("Same Name Prevention (Case Variant)", True, 
                         f"Correctly prevented changing to case variant '{same_name_different_case}'")
            return True
        else:
            self.log_test("Same Name Prevention (Case Variant)", False, 
                         f"Should have prevented case variant change. Status: {status}, Response: {data}")
            return False
    
    async def test_authentication_validation(self):
        """Test authentication token validation"""
        print("\n🔐 TESTING AUTHENTICATION VALIDATION")
        
        # Test 1: Request without authentication
        try:
            async with self.session.get(f"{API_BASE}/user/name-change-info") as response:
                if response.status == 401:
                    self.log_test("Unauthenticated Request Rejection", True, 
                                 "Correctly rejected request without auth token")
                else:
                    self.log_test("Unauthenticated Request Rejection", False, 
                                 f"Should have returned 401, got {response.status}")
                    return False
        except Exception as e:
            self.log_test("Unauthenticated Request Rejection", False, f"Error: {str(e)}")
            return False
        
        # Test 2: Request with invalid token
        try:
            headers = {
                'Authorization': 'Bearer invalid_token_here',
                'Content-Type': 'application/json'
            }
            async with self.session.get(f"{API_BASE}/user/name-change-info", headers=headers) as response:
                if response.status == 401:
                    self.log_test("Invalid Token Rejection", True, 
                                 "Correctly rejected request with invalid token")
                    return True
                else:
                    self.log_test("Invalid Token Rejection", False, 
                                 f"Should have returned 401, got {response.status}")
                    return False
        except Exception as e:
            self.log_test("Invalid Token Rejection", False, f"Error: {str(e)}")
            return False
    
    async def test_database_persistence(self):
        """Test database persistence of name changes"""
        print("\n💾 TESTING DATABASE PERSISTENCE")
        
        if not self.test_users:
            self.log_test("Database Persistence", False, "No test users available")
            return False
        
        user = self.test_users[0]
        
        # Get current name change info
        status, before_data = await self.make_authenticated_request('GET', '/user/name-change-info', user)
        
        if status != 200:
            self.log_test("Database Persistence", False, f"Failed to get initial data: {status}")
            return False
        
        # Perform a name change
        new_name = f"PersistenceTest_{datetime.now().strftime('%H%M%S')}"
        payload = {
            "new_name": new_name,
            "payment_method": "demo"
        }
        
        status, change_data = await self.make_authenticated_request('POST', '/user/change-name', user, payload)
        
        if status != 200:
            self.log_test("Database Persistence", False, f"Name change failed: {status}")
            return False
        
        # Update user data
        user['name'] = new_name
        user['user']['name'] = new_name
        
        # Get updated name change info
        status, after_data = await self.make_authenticated_request('GET', '/user/name-change-info', user)
        
        if status != 200:
            self.log_test("Database Persistence", False, f"Failed to get updated data: {status}")
            return False
        
        # Verify persistence
        if (after_data['current_name'] == new_name and 
            after_data['name_changes_used'] == before_data['name_changes_used'] + 1):
            
            self.log_test("Database Persistence", True, 
                         f"Name and counter correctly persisted. Changes: {before_data['name_changes_used']} → {after_data['name_changes_used']}")
            return True
        else:
            self.log_test("Database Persistence", False, 
                         f"Persistence failed. Before: {before_data}, After: {after_data}")
            return False
    
    async def test_payment_simulation(self):
        """Test payment simulation with demo method"""
        print("\n💳 TESTING PAYMENT SIMULATION")
        
        if not self.test_users:
            self.log_test("Payment Simulation", False, "No test users available")
            return False
        
        # Create a new user for payment testing
        payment_user = await self.register_test_user(
            "paymenttest@example.com", 
            "testpass123", 
            "PaymentTestUser"
        )
        
        if not payment_user:
            self.log_test("Payment Simulation", False, "Failed to create payment test user")
            return False
        
        # Use up the free change
        payload = {
            "new_name": "FirstChange",
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', payment_user, payload)
        
        if status != 200:
            self.log_test("Payment Simulation", False, f"Free change failed: {status}")
            return False
        
        payment_user['name'] = "FirstChange"
        
        # Now test paid change with demo payment
        payload = {
            "new_name": "PaidChange",
            "payment_method": "demo"
        }
        
        status, data = await self.make_authenticated_request('POST', '/user/change-name', payment_user, payload)
        
        if (status == 200 and 
            data.get('success') and 
            data.get('cost') == 6.99 and 
            data.get('was_free') == False):
            
            self.log_test("Payment Simulation", True, 
                         f"Demo payment processed successfully for ${data.get('cost')}")
            return True
        else:
            self.log_test("Payment Simulation", False, 
                         f"Payment simulation failed. Status: {status}, Response: {data}")
            return False
    
    async def run_all_tests(self):
        """Run all name change functionality tests"""
        print("🚀 STARTING COMPREHENSIVE NAME CHANGE FUNCTIONALITY TESTING")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Basic connectivity
            if not await self.test_health_check():
                print("❌ Health check failed - aborting tests")
                return
            
            # Authentication setup
            if not await self.test_user_registration_and_auth():
                print("❌ User registration failed - aborting tests")
                return
            
            # Core name change functionality tests
            test_functions = [
                self.test_name_change_info_endpoint,
                self.test_free_name_change,
                self.test_paid_name_change,
                self.test_name_availability_logic,
                self.test_case_insensitive_name_checking,
                self.test_same_name_prevention,
                self.test_authentication_validation,
                self.test_database_persistence,
                self.test_payment_simulation
            ]
            
            for test_func in test_functions:
                try:
                    await test_func()
                except Exception as e:
                    self.log_test(test_func.__name__, False, f"Exception: {str(e)}")
            
            # Summary
            self.print_summary()
            
        finally:
            await self.cleanup_session()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)

async def main():
    """Main test execution"""
    tester = BackendTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())