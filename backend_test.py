#!/usr/bin/env python3
"""
Backend API Testing Suite for Subscription System
Tests all subscription endpoints with authentication

REVIEW REQUEST:
1. Test /api/subscriptions/active endpoint - should return empty list initially
2. Test /api/subscriptions/benefits endpoint - should return default multipliers (1.0 for all)
3. Test /api/subscriptions/purchase endpoint with both subscription types:
   - xp_drop_boost subscription ($40, 30 days)
   - zone_progression_boost subscription ($40, 30 days)
4. After purchase, verify:
   - /api/subscriptions/active shows the purchased subscription
   - /api/subscriptions/benefits returns correct multipliers (2.0 for subscribed features)
5. Test duplicate purchase prevention (should fail if already subscribed)

Focus on:
- Authentication working correctly for all subscription endpoints
- Proper server-time tracking of subscription start/end dates
- Correct subscription benefits/multipliers being returned
- Database persistence of subscription data
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration
BASE_URL = "https://idle-ninja-fix.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_USER_NAME = "Test Subscription User"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def register_test_user(self):
        """Register a new test user for subscription testing"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            })
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.session.headers.update({
                    "Authorization": f"Bearer {self.access_token}"
                })
                self.log_test("User Registration", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_test("User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_health_check(self):
        """Test basic API health check"""
        try:
            response = self.session.get(f"{BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Message: {data.get('message', 'No message')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_subscriptions_active_empty(self):
        """Test /api/subscriptions/active endpoint - should return empty list initially"""
        try:
            response = self.session.get(f"{BASE_URL}/subscriptions/active")
            
            if response.status_code == 200:
                data = response.json()
                subscriptions = data.get("subscriptions", [])
                if len(subscriptions) == 0:
                    self.log_test("Active Subscriptions (Empty)", True, "No active subscriptions found as expected")
                    return True
                else:
                    self.log_test("Active Subscriptions (Empty)", False, f"Expected empty list, got {len(subscriptions)} subscriptions")
                    return False
            else:
                self.log_test("Active Subscriptions (Empty)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Active Subscriptions (Empty)", False, f"Exception: {str(e)}")
            return False
    
    def test_subscriptions_benefits_default(self):
        """Test /api/subscriptions/benefits endpoint - should return default multipliers (1.0)"""
        try:
            response = self.session.get(f"{BASE_URL}/subscriptions/benefits")
            
            if response.status_code == 200:
                data = response.json()
                expected_defaults = {
                    "xp_multiplier": 1.0,
                    "drop_multiplier": 1.0,
                    "zone_kill_multiplier": 1.0
                }
                
                success = True
                details = []
                for key, expected_value in expected_defaults.items():
                    actual_value = data.get(key)
                    if actual_value == expected_value:
                        details.append(f"{key}: {actual_value} ✓")
                    else:
                        details.append(f"{key}: expected {expected_value}, got {actual_value} ✗")
                        success = False
                
                active_subs = data.get("active_subscriptions", [])
                details.append(f"Active subscriptions: {len(active_subs)}")
                
                self.log_test("Subscription Benefits (Default)", success, "; ".join(details))
                return success
            else:
                self.log_test("Subscription Benefits (Default)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Subscription Benefits (Default)", False, f"Exception: {str(e)}")
            return False
    
    def test_purchase_xp_drop_boost(self):
        """Test purchasing xp_drop_boost subscription"""
        try:
            response = self.session.post(f"{BASE_URL}/subscriptions/purchase", json={
                "subscription_type": "xp_drop_boost",
                "payment_method": "demo"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True:
                    subscription = data.get("subscription", {})
                    details = [
                        f"Type: {subscription.get('subscription_type')}",
                        f"Price: ${subscription.get('price')}",
                        f"Duration: {subscription.get('duration_days')} days",
                        f"Active: {subscription.get('is_active')}"
                    ]
                    self.log_test("Purchase XP Drop Boost", True, "; ".join(details))
                    return True
                else:
                    self.log_test("Purchase XP Drop Boost", False, f"Success=False: {data}")
                    return False
            else:
                self.log_test("Purchase XP Drop Boost", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Purchase XP Drop Boost", False, f"Exception: {str(e)}")
            return False
    
    def test_purchase_zone_progression_boost(self):
        """Test purchasing zone_progression_boost subscription"""
        try:
            response = self.session.post(f"{BASE_URL}/subscriptions/purchase", json={
                "subscription_type": "zone_progression_boost",
                "payment_method": "demo"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") == True:
                    subscription = data.get("subscription", {})
                    details = [
                        f"Type: {subscription.get('subscription_type')}",
                        f"Price: ${subscription.get('price')}",
                        f"Duration: {subscription.get('duration_days')} days",
                        f"Active: {subscription.get('is_active')}"
                    ]
                    self.log_test("Purchase Zone Progression Boost", True, "; ".join(details))
                    return True
                else:
                    self.log_test("Purchase Zone Progression Boost", False, f"Success=False: {data}")
                    return False
            else:
                self.log_test("Purchase Zone Progression Boost", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Purchase Zone Progression Boost", False, f"Exception: {str(e)}")
            return False
    
    def test_subscriptions_active_after_purchase(self):
        """Test /api/subscriptions/active endpoint after purchases - should show both subscriptions"""
        try:
            response = self.session.get(f"{BASE_URL}/subscriptions/active")
            
            if response.status_code == 200:
                data = response.json()
                subscriptions = data.get("subscriptions", [])
                
                if len(subscriptions) == 2:
                    # Check for both subscription types
                    types_found = [sub.get("subscription_type") for sub in subscriptions]
                    expected_types = ["xp_drop_boost", "zone_progression_boost"]
                    
                    if all(t in types_found for t in expected_types):
                        details = [f"Found {len(subscriptions)} active subscriptions: {', '.join(types_found)}"]
                        for sub in subscriptions:
                            details.append(f"{sub.get('subscription_type')}: ${sub.get('price')}, {sub.get('duration_days')} days")
                        self.log_test("Active Subscriptions (After Purchase)", True, "; ".join(details))
                        return True
                    else:
                        self.log_test("Active Subscriptions (After Purchase)", False, f"Expected types {expected_types}, found {types_found}")
                        return False
                else:
                    self.log_test("Active Subscriptions (After Purchase)", False, f"Expected 2 subscriptions, found {len(subscriptions)}")
                    return False
            else:
                self.log_test("Active Subscriptions (After Purchase)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Active Subscriptions (After Purchase)", False, f"Exception: {str(e)}")
            return False
    
    def test_subscriptions_benefits_after_purchase(self):
        """Test /api/subscriptions/benefits endpoint after purchases - should return 2.0 multipliers"""
        try:
            response = self.session.get(f"{BASE_URL}/subscriptions/benefits")
            
            if response.status_code == 200:
                data = response.json()
                expected_values = {
                    "xp_multiplier": 2.0,  # From xp_drop_boost
                    "drop_multiplier": 2.0,  # From xp_drop_boost
                    "zone_kill_multiplier": 2.0  # From zone_progression_boost
                }
                
                success = True
                details = []
                for key, expected_value in expected_values.items():
                    actual_value = data.get(key)
                    if actual_value == expected_value:
                        details.append(f"{key}: {actual_value} ✓")
                    else:
                        details.append(f"{key}: expected {expected_value}, got {actual_value} ✗")
                        success = False
                
                active_subs = data.get("active_subscriptions", [])
                details.append(f"Active subscriptions: {len(active_subs)}")
                
                self.log_test("Subscription Benefits (After Purchase)", success, "; ".join(details))
                return success
            else:
                self.log_test("Subscription Benefits (After Purchase)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Subscription Benefits (After Purchase)", False, f"Exception: {str(e)}")
            return False
    
    def test_duplicate_purchase_prevention(self):
        """Test duplicate purchase prevention - should fail if already subscribed"""
        try:
            # Try to purchase xp_drop_boost again
            response = self.session.post(f"{BASE_URL}/subscriptions/purchase", json={
                "subscription_type": "xp_drop_boost",
                "payment_method": "demo"
            })
            
            if response.status_code == 400:
                data = response.json()
                detail = data.get("detail", "")
                if "already have an active subscription" in detail:
                    self.log_test("Duplicate Purchase Prevention", True, f"Correctly prevented duplicate purchase: {detail}")
                    return True
                else:
                    self.log_test("Duplicate Purchase Prevention", False, f"Wrong error message: {detail}")
                    return False
            else:
                self.log_test("Duplicate Purchase Prevention", False, f"Expected 400 status, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Duplicate Purchase Prevention", False, f"Exception: {str(e)}")
            return False
    
    def test_authentication_protection(self):
        """Test that subscription endpoints require authentication"""
        try:
            # Create a session without authentication
            unauth_session = requests.Session()
            
            endpoints_to_test = [
                "/subscriptions/active",
                "/subscriptions/benefits",
                "/subscriptions/purchase"
            ]
            
            all_protected = True
            details = []
            
            for endpoint in endpoints_to_test:
                if endpoint == "/subscriptions/purchase":
                    response = unauth_session.post(f"{BASE_URL}{endpoint}", json={
                        "subscription_type": "xp_drop_boost",
                        "payment_method": "demo"
                    })
                else:
                    response = unauth_session.get(f"{BASE_URL}{endpoint}")
                
                if response.status_code == 401:
                    details.append(f"{endpoint}: 401 ✓")
                else:
                    details.append(f"{endpoint}: {response.status_code} ✗")
                    all_protected = False
            
            self.log_test("Authentication Protection", all_protected, "; ".join(details))
            return all_protected
            
        except Exception as e:
            self.log_test("Authentication Protection", False, f"Exception: {str(e)}")
            return False
    
    def test_server_time_tracking(self):
        """Test that subscription dates are tracked with server time"""
        try:
            # Get active subscriptions to check date tracking
            response = self.session.get(f"{BASE_URL}/subscriptions/active")
            
            if response.status_code == 200:
                data = response.json()
                subscriptions = data.get("subscriptions", [])
                
                if len(subscriptions) > 0:
                    success = True
                    details = []
                    
                    for sub in subscriptions:
                        start_date = sub.get("start_date")
                        end_date = sub.get("end_date")
                        created_at = sub.get("created_at")
                        
                        if start_date and end_date and created_at:
                            # Parse dates to verify they're valid ISO format
                            try:
                                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                                created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                                
                                # Check that end_date is after start_date
                                duration_days = (end_dt - start_dt).days
                                details.append(f"{sub.get('subscription_type')}: {duration_days} days duration ✓")
                                
                            except ValueError as e:
                                details.append(f"{sub.get('subscription_type')}: Invalid date format ✗")
                                success = False
                        else:
                            details.append(f"{sub.get('subscription_type')}: Missing date fields ✗")
                            success = False
                    
                    self.log_test("Server Time Tracking", success, "; ".join(details))
                    return success
                else:
                    self.log_test("Server Time Tracking", False, "No subscriptions found to test date tracking")
                    return False
            else:
                self.log_test("Server Time Tracking", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Server Time Tracking", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all subscription system tests"""
        print("🚀 Starting Subscription System Backend Tests")
        print(f"📍 Testing against: {BASE_URL}")
        print(f"👤 Test user: {TEST_USER_EMAIL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.register_test_user,
            self.test_authentication_protection,
            self.test_subscriptions_active_empty,
            self.test_subscriptions_benefits_default,
            self.test_purchase_xp_drop_boost,
            self.test_purchase_zone_progression_boost,
            self.test_subscriptions_active_after_purchase,
            self.test_subscriptions_benefits_after_purchase,
            self.test_duplicate_purchase_prevention,
            self.test_server_time_tracking
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
                time.sleep(0.5)  # Small delay between tests
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test.__name__}: {str(e)}")
        
        print("=" * 60)
        print(f"📊 SUBSCRIPTION SYSTEM TEST RESULTS: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL SUBSCRIPTION TESTS PASSED!")
        else:
            print(f"⚠️  {total - passed} tests failed - see details above")
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)