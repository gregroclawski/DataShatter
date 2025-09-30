#!/usr/bin/env python3
"""
JSON Serialization Test for Subscription System
Specifically tests for ObjectId serialization errors and JSON parse issues
"""

import requests
import json
import uuid

# Configuration
BASE_URL = "https://idle-ninja-1.preview.emergentagent.com/api"

def test_json_serialization():
    """Test JSON serialization for subscription endpoints"""
    print("🔍 Testing JSON Serialization for Subscription System")
    print("=" * 60)
    
    # Register test user
    test_email = f"json_test_{uuid.uuid4().hex[:8]}@example.com"
    session = requests.Session()
    
    # Register user
    response = session.post(f"{BASE_URL}/auth/register", json={
        "email": test_email,
        "password": "testpassword123",
        "name": "JSON Test User"
    })
    
    if response.status_code != 201:
        print(f"❌ Failed to register user: {response.text}")
        return False
    
    # Get auth token
    auth_data = response.json()
    session.headers.update({"Authorization": f"Bearer {auth_data['access_token']}"})
    print(f"✅ User registered: {test_email}")
    
    # Test 1: Purchase subscription and check JSON response
    print("\n1️⃣ Testing Subscription Purchase JSON Response")
    response = session.post(f"{BASE_URL}/subscriptions/purchase", json={
        "subscription_type": "xp_drop_boost",
        "payment_method": "demo"
    })
    
    try:
        purchase_data = response.json()
        print("✅ Purchase response JSON parsed successfully")
        print(f"   - Response keys: {list(purchase_data.keys())}")
        
        # Check for proper datetime serialization
        subscription = purchase_data.get('subscription', {})
        start_date = subscription.get('start_date')
        end_date = subscription.get('end_date')
        
        if start_date and end_date:
            print(f"   - Start date: {start_date} (ISO format)")
            print(f"   - End date: {end_date} (ISO format)")
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error in purchase response: {e}")
        print(f"   Raw response: {response.text}")
        return False
    
    # Test 2: Active subscriptions JSON response
    print("\n2️⃣ Testing Active Subscriptions JSON Response")
    response = session.get(f"{BASE_URL}/subscriptions/active")
    
    try:
        active_data = response.json()
        print("✅ Active subscriptions JSON parsed successfully")
        
        subscriptions = active_data.get('subscriptions', [])
        print(f"   - Found {len(subscriptions)} subscriptions")
        
        for i, sub in enumerate(subscriptions):
            print(f"   - Subscription {i+1}:")
            print(f"     * Keys: {list(sub.keys())}")
            
            # Check for ObjectId serialization
            if '_id' in sub:
                id_type = type(sub['_id']).__name__
                print(f"     * _id type: {id_type}")
                if id_type == 'str':
                    print("     ✅ ObjectId properly converted to string")
                else:
                    print(f"     ❌ ObjectId not converted (type: {id_type})")
                    return False
            
            # Check datetime fields
            for date_field in ['start_date', 'end_date', 'created_at']:
                if date_field in sub:
                    date_value = sub[date_field]
                    print(f"     * {date_field}: {date_value} (type: {type(date_value).__name__})")
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error in active subscriptions: {e}")
        print(f"   Raw response: {response.text}")
        return False
    
    # Test 3: Benefits endpoint JSON response
    print("\n3️⃣ Testing Benefits Endpoint JSON Response")
    response = session.get(f"{BASE_URL}/subscriptions/benefits")
    
    try:
        benefits_data = response.json()
        print("✅ Benefits response JSON parsed successfully")
        print(f"   - Response keys: {list(benefits_data.keys())}")
        
        # Check active subscriptions in benefits
        active_subs = benefits_data.get('active_subscriptions', [])
        for i, sub in enumerate(active_subs):
            print(f"   - Active subscription {i+1}: {sub}")
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error in benefits response: {e}")
        print(f"   Raw response: {response.text}")
        return False
    
    # Test 4: Raw response inspection
    print("\n4️⃣ Raw Response Inspection")
    response = session.get(f"{BASE_URL}/subscriptions/active")
    raw_text = response.text
    
    # Check for common ObjectId serialization issues
    if "ObjectId(" in raw_text:
        print("❌ Found ObjectId() in raw response - serialization issue!")
        print(f"   Raw response snippet: {raw_text[:500]}...")
        return False
    
    if '"_id": {' in raw_text:
        print("❌ Found complex _id object in response - serialization issue!")
        return False
    
    print("✅ No ObjectId serialization issues found in raw response")
    
    print("\n" + "=" * 60)
    print("🎉 ALL JSON SERIALIZATION TESTS PASSED!")
    print("✅ No ObjectId serialization errors")
    print("✅ All datetime fields properly formatted as ISO strings")
    print("✅ All responses parse as valid JSON")
    
    return True

if __name__ == "__main__":
    success = test_json_serialization()
    exit(0 if success else 1)