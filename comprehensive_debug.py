#!/usr/bin/env python3
"""
Comprehensive debug script to understand name change race conditions
"""

import asyncio
import aiohttp
import json

BACKEND_URL = "https://idle-ninja-game.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

async def comprehensive_debug():
    """Comprehensive debug of name change system"""
    
    async with aiohttp.ClientSession() as session:
        print("🔍 COMPREHENSIVE NAME CHANGE DEBUG")
        
        # Step 1: Register two fresh users
        print("\n1. Registering fresh users:")
        
        user1_data = {
            "email": f"comptest1_{asyncio.get_event_loop().time()}@example.com",
            "password": "testpass123",
            "name": f"CompUser1_{int(asyncio.get_event_loop().time())}"
        }
        
        user2_data = {
            "email": f"comptest2_{asyncio.get_event_loop().time()}@example.com",
            "password": "testpass123", 
            "name": f"CompUser2_{int(asyncio.get_event_loop().time())}"
        }
        
        # Register user1
        async with session.post(f"{API_BASE}/auth/register", json=user1_data) as response:
            if response.status == 201:
                user1_auth = await response.json()
                print(f"   User1: {user1_auth['user']['name']} (ID: {user1_auth['user']['id']})")
            else:
                print(f"   User1 registration failed: {response.status}")
                return
        
        # Register user2
        async with session.post(f"{API_BASE}/auth/register", json=user2_data) as response:
            if response.status == 201:
                user2_auth = await response.json()
                print(f"   User2: {user2_auth['user']['name']} (ID: {user2_auth['user']['id']})")
            else:
                print(f"   User2 registration failed: {response.status}")
                return
        
        # Step 2: Check initial states
        print("\n2. Initial name change info:")
        
        headers1 = {
            'Authorization': f"Bearer {user1_auth['access_token']}",
            'Content-Type': 'application/json'
        }
        
        headers2 = {
            'Authorization': f"Bearer {user2_auth['access_token']}",
            'Content-Type': 'application/json'
        }
        
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers1) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User1: {data['current_name']}, changes: {data['name_changes_used']}, free: {data['next_change_free']}")
        
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers2) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User2: {data['current_name']}, changes: {data['name_changes_used']}, free: {data['next_change_free']}")
        
        # Step 3: Test User1 trying to take User2's name
        print(f"\n3. User1 trying to take User2's name '{user2_auth['user']['name']}':")
        
        payload = {
            "new_name": user2_auth['user']['name'],
            "payment_method": "demo"
        }
        
        async with session.post(f"{API_BASE}/user/change-name", headers=headers1, json=payload) as response:
            print(f"   Status: {response.status}")
            data = await response.json()
            print(f"   Response: {data}")
        
        # Step 4: Check states after attempt
        print("\n4. States after name change attempt:")
        
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers1) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User1: {data['current_name']}, changes: {data['name_changes_used']}")
        
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers2) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User2: {data['current_name']}, changes: {data['name_changes_used']}")
        
        # Step 5: Test case-insensitive conflict
        print(f"\n5. User1 trying case variant of User2's name:")
        
        case_variant = user2_auth['user']['name'].upper()
        payload = {
            "new_name": case_variant,
            "payment_method": "demo"
        }
        
        async with session.post(f"{API_BASE}/user/change-name", headers=headers1, json=payload) as response:
            print(f"   Status: {response.status}")
            data = await response.json()
            print(f"   Response: {data}")
        
        # Step 6: Test User1 trying to change to their own name
        print(f"\n6. User1 trying to change to their own current name:")
        
        # Get current name first
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers1) as response:
            if response.status == 200:
                current_data = await response.json()
                current_name = current_data['current_name']
                
                payload = {
                    "new_name": current_name,
                    "payment_method": "demo"
                }
                
                async with session.post(f"{API_BASE}/user/change-name", headers=headers1, json=payload) as response:
                    print(f"   Status: {response.status}")
                    data = await response.json()
                    print(f"   Response: {data}")
        
        # Step 7: Test successful name change
        print(f"\n7. User1 changing to a unique name:")
        
        unique_name = f"UniqueUser_{int(asyncio.get_event_loop().time())}"
        payload = {
            "new_name": unique_name,
            "payment_method": "demo"
        }
        
        async with session.post(f"{API_BASE}/user/change-name", headers=headers1, json=payload) as response:
            print(f"   Status: {response.status}")
            data = await response.json()
            print(f"   Response: {data}")
        
        # Step 8: Final states
        print("\n8. Final states:")
        
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers1) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User1: {data['current_name']}, changes: {data['name_changes_used']}")
        
        async with session.get(f"{API_BASE}/user/name-change-info", headers=headers2) as response:
            if response.status == 200:
                data = await response.json()
                print(f"   User2: {data['current_name']}, changes: {data['name_changes_used']}")

if __name__ == "__main__":
    asyncio.run(comprehensive_debug())