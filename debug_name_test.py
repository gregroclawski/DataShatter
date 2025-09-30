#!/usr/bin/env python3
"""
Debug script to understand name change issues
"""

import asyncio
import aiohttp
import json

BACKEND_URL = "https://idle-ninja-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

async def debug_name_issues():
    """Debug name change issues"""
    
    async with aiohttp.ClientSession() as session:
        print("🔍 DEBUGGING NAME CHANGE ISSUES")
        
        # Test 1: Check unauthenticated request
        print("\n1. Testing unauthenticated request:")
        async with session.get(f"{API_BASE}/user/name-change-info") as response:
            print(f"   Status: {response.status}")
            try:
                data = await response.json()
                print(f"   Response: {data}")
            except:
                text = await response.text()
                print(f"   Response text: {text}")
        
        # Test 2: Register two users and check name conflicts
        print("\n2. Testing name conflict detection:")
        
        # Register user 1
        user1_data = {
            "email": "debug1@example.com",
            "password": "testpass123",
            "name": "DebugUser1"
        }
        
        async with session.post(f"{API_BASE}/auth/register", json=user1_data) as response:
            if response.status == 201:
                user1_auth = await response.json()
                print(f"   User1 registered: {user1_auth['user']['name']}")
            else:
                print(f"   User1 registration failed: {response.status}")
                return
        
        # Register user 2
        user2_data = {
            "email": "debug2@example.com", 
            "password": "testpass123",
            "name": "DebugUser2"
        }
        
        async with session.post(f"{API_BASE}/auth/register", json=user2_data) as response:
            if response.status == 201:
                user2_auth = await response.json()
                print(f"   User2 registered: {user2_auth['user']['name']}")
            else:
                print(f"   User2 registration failed: {response.status}")
                return
        
        # Test 3: Try user1 taking user2's name
        print("\n3. Testing name conflict (User1 trying to take User2's name):")
        headers = {
            'Authorization': f"Bearer {user1_auth['access_token']}",
            'Content-Type': 'application/json'
        }
        
        payload = {
            "new_name": "DebugUser2",  # Try to take user2's name
            "payment_method": "demo"
        }
        
        async with session.post(f"{API_BASE}/user/change-name", headers=headers, json=payload) as response:
            print(f"   Status: {response.status}")
            data = await response.json()
            print(f"   Response: {data}")
        
        # Test 4: Check database state
        print("\n4. Checking current user states:")
        
        # Check user1 current name
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User1 current name: {data['current_name']}")
        
        # Check user2 current name
        headers2 = {
            'Authorization': f"Bearer {user2_auth['access_token']}",
            'Content-Type': 'application/json'
        }
        
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers2) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User2 current name: {data['current_name']}")

if __name__ == "__main__":
    asyncio.run(debug_name_issues())