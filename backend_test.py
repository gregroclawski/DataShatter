#!/usr/bin/env python3
"""
Backend API Testing Script for Registration System
Tests email and username uniqueness validation

REVIEW REQUEST:
1. Test successful registration with unique email and username
2. Test email uniqueness validation with existing email "gregroclawski@gmail.com"
3. Test username uniqueness validation with existing username "Freshy"
4. Test duplicate name with different case "freshy" (lowercase)
5. Verify all validation error responses return proper HTTP status codes and error messages

Focus on:
- Both email and name uniqueness checks are working
- Proper error messages for each validation failure  
- HTTP status codes are correct (400 Bad Request)
- Case sensitivity behavior for usernames
- Successful registration still works with unique credentials
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL from frontend .env
BACKEND_URL = "https://idle-ninja-game.preview.emergentagent.com/api"

def test_api_call(method: str, endpoint: str, data: Dict[Any, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
    """Make API call and return response details"""
    url = f"{BACKEND_URL}{endpoint}"
    
    try:
        if method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers or {})
        elif method.upper() == "GET":
            response = requests.get(url, headers=headers or {})
        else:
            return {"error": f"Unsupported method: {method}"}
        
        result = {
            "status_code": response.status_code,
            "url": url,
            "method": method.upper()
        }
        
        try:
            result["json"] = response.json()
        except:
            result["text"] = response.text
            
        return result
        
    except Exception as e:
        return {"error": str(e), "url": url, "method": method.upper()}

def print_test_result(test_name: str, result: Dict[str, Any], expected_status: int = None, expected_message: str = None):
    """Print formatted test result"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")
    
    if "error" in result:
        print(f"❌ ERROR: {result['error']}")
        return False
    
    print(f"URL: {result['url']}")
    print(f"Method: {result['method']}")
    print(f"Status Code: {result['status_code']}")
    
    if "json" in result:
        print(f"Response: {json.dumps(result['json'], indent=2)}")
    elif "text" in result:
        print(f"Response Text: {result['text']}")
    
    # Check expected status code
    if expected_status and result['status_code'] != expected_status:
        print(f"❌ EXPECTED STATUS: {expected_status}, GOT: {result['status_code']}")
        return False
    
    # Check expected message
    if expected_message and "json" in result:
        response_text = json.dumps(result['json']).lower()
        if expected_message.lower() not in response_text:
            print(f"❌ EXPECTED MESSAGE: '{expected_message}' not found in response")
            return False
    
    print("✅ TEST PASSED")
    return True

def main():
    """Run registration system tests"""
    print("🚀 STARTING REGISTRATION SYSTEM TESTING")
    print(f"Backend URL: {BACKEND_URL}")
    
    test_results = []
    
    # Test 1: Health Check
    print("\n" + "="*80)
    print("HEALTH CHECK")
    print("="*80)
    
    health_result = test_api_call("GET", "/")
    success = print_test_result("Health Check", health_result, 200)
    test_results.append(("Health Check", success))
    
    # Test 2: Successful registration with unique credentials
    print("\n" + "="*80)
    print("REGISTRATION TESTS")
    print("="*80)
    
    unique_registration_data = {
        "email": "uniquetest@example.com",
        "name": "UniqueTestUser",
        "password": "testpassword123"
    }
    
    reg_result = test_api_call("POST", "/auth/register", unique_registration_data)
    success = print_test_result(
        "Successful Registration with Unique Credentials", 
        reg_result, 
        201
    )
    test_results.append(("Successful Registration", success))
    
    # Test 3: Email uniqueness validation - existing email
    existing_email_data = {
        "email": "gregroclawski@gmail.com",
        "name": "TestUser2",
        "password": "testpassword123"
    }
    
    email_dup_result = test_api_call("POST", "/auth/register", existing_email_data)
    success = print_test_result(
        "Email Uniqueness Validation - Existing Email", 
        email_dup_result, 
        400,
        "Email already registered"
    )
    test_results.append(("Email Uniqueness Validation", success))
    
    # Test 4: Username uniqueness validation - existing username
    existing_username_data = {
        "email": "newuser@example.com",
        "name": "Freshy",
        "password": "testpassword123"
    }
    
    username_dup_result = test_api_call("POST", "/auth/register", existing_username_data)
    success = print_test_result(
        "Username Uniqueness Validation - Existing Username", 
        username_dup_result, 
        400,
        "Username already taken"
    )
    test_results.append(("Username Uniqueness Validation", success))
    
    # Test 5: Case sensitivity test - lowercase username
    case_sensitive_data = {
        "email": "casetest@example.com",
        "name": "freshy",  # lowercase version
        "password": "testpassword123"
    }
    
    case_result = test_api_call("POST", "/auth/register", case_sensitive_data)
    success = print_test_result(
        "Case Sensitivity Test - Lowercase Username", 
        case_result
    )
    
    # Determine if case sensitivity is working based on response
    if case_result.get("status_code") == 400 and "json" in case_result:
        response_text = json.dumps(case_result["json"]).lower()
        if "username already taken" in response_text:
            print("✅ CASE INSENSITIVE: Username 'freshy' rejected (case-insensitive validation)")
            test_results.append(("Case Sensitivity (Case-Insensitive)", True))
        else:
            print("❓ UNEXPECTED: Different error message for case test")
            test_results.append(("Case Sensitivity (Unexpected)", False))
    elif case_result.get("status_code") == 201:
        print("✅ CASE SENSITIVE: Username 'freshy' accepted (case-sensitive validation)")
        test_results.append(("Case Sensitivity (Case-Sensitive)", True))
    else:
        print("❌ CASE SENSITIVITY TEST FAILED")
        test_results.append(("Case Sensitivity", False))
    
    # Test 6: Password validation - too short
    short_password_data = {
        "email": "shortpass@example.com",
        "name": "ShortPassUser",
        "password": "short"  # Less than 8 characters
    }
    
    short_pass_result = test_api_call("POST", "/auth/register", short_password_data)
    success = print_test_result(
        "Password Validation - Too Short", 
        short_pass_result, 
        400
    )
    test_results.append(("Password Validation", success))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = 0
    total = len(test_results)
    
    for test_name, success in test_results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
        if success:
            passed += 1
    
    print(f"\nOVERALL RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Registration system working correctly!")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED - Issues found in registration system")
        return 1

if __name__ == "__main__":
    sys.exit(main())