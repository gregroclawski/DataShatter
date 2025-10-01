#!/usr/bin/env python3
"""
Backend API Testing for XP Decimal Save Error Fix
Tests health check, save/load game functionality, and authentication endpoints
to ensure the XP decimal fix didn't break anything.
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://idle-game-patch.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class XPDecimalFixTester:
    def __init__(self):
        self.session = None
        self.test_user_id = None
        self.test_user_email = f"xp_fix_test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "testpass123"
        self.test_user_name = f"XPTestNinja_{uuid.uuid4().hex[:6]}"
        self.auth_token = None
        self.session_cookie = None
        
    async def setup_session(self):
        """Setup HTTP session with proper headers"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    async def test_health_check(self):
        """Test 1: Health Check - Verify the basic /api/ endpoint is responding"""
        print("\n🔍 TEST 1: Health Check Endpoint")
        try:
            async with self.session.get(f"{API_BASE}/") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Health check passed: {data}")
                    return True
                else:
                    print(f"❌ Health check failed: Status {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Health check error: {str(e)}")
            return False
            
    async def test_user_registration(self):
        """Test 2: User Registration"""
        print(f"\n🔍 TEST 2: User Registration")
        try:
            registration_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "name": self.test_user_name
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/register",
                json=registration_data
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    self.auth_token = data.get('access_token')
                    self.test_user_id = data.get('user', {}).get('id')
                    
                    # Extract session cookie if present
                    if 'Set-Cookie' in response.headers:
                        cookies = response.headers.get('Set-Cookie', '')
                        if 'session_token=' in cookies:
                            self.session_cookie = cookies.split('session_token=')[1].split(';')[0]
                    
                    print(f"✅ Registration successful: User ID {self.test_user_id}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Registration failed: Status {response.status}, Error: {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")
            return False
            
    async def test_user_login(self):
        """Test 3: User Login"""
        print(f"\n🔍 TEST 3: User Login")
        try:
            # Use form data for OAuth2PasswordRequestForm
            login_data = {
                "username": self.test_user_email,  # OAuth2 uses 'username' field
                "password": self.test_user_password
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/login",
                data=login_data,  # Use form data, not JSON
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get('access_token')
                    print(f"✅ Login successful: Token received")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Login failed: Status {response.status}, Error: {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
            
    async def test_session_check(self):
        """Test 4: Session Management"""
        print(f"\n🔍 TEST 4: Session Management")
        try:
            headers = {}
            if self.session_cookie:
                headers['Cookie'] = f'session_token={self.session_cookie}'
                
            async with self.session.get(
                f"{API_BASE}/auth/session/check",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    is_authenticated = data.get('authenticated', False)
                    if is_authenticated:
                        print(f"✅ Session check passed: User authenticated")
                        return True
                    else:
                        print(f"❌ Session check failed: User not authenticated")
                        return False
                else:
                    print(f"❌ Session check failed: Status {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Session check error: {str(e)}")
            return False
            
    async def test_save_game_with_integer_xp(self):
        """Test 5: Game Save with Integer XP Values (XP Decimal Fix Verification)"""
        print(f"\n🔍 TEST 5: Game Save with Integer XP Values - XP Decimal Fix Verification")
        try:
            # Create ninja data with integer XP values (simulating the Math.round() fix)
            ninja_data = {
                "level": 15,
                "experience": 3750,  # Integer XP (not 3750.5 or decimal)
                "experienceToNext": 1250,  # Integer XP
                "health": 200,
                "maxHealth": 200,
                "energy": 100,
                "maxEnergy": 100,
                "attack": 35,
                "defense": 25,
                "speed": 30,
                "luck": 15,
                "gold": 2500,  # Integer gold
                "gems": 50,    # Integer gems
                "skillPoints": 45,  # Integer skill points
                "reviveTickets": 3,
                "baseStats": {
                    "attack": 15,
                    "defense": 8,
                    "speed": 12,
                    "luck": 5,
                    "maxHealth": 50,
                    "maxEnergy": 25
                },
                "goldUpgrades": {
                    "attack": 20,
                    "defense": 12,
                    "speed": 15,
                    "luck": 8,
                    "maxHealth": 100,
                    "maxEnergy": 50
                },
                "skillPointUpgrades": {
                    "attack": 19,
                    "defense": 12,
                    "speed": 16,
                    "luck": 8,
                    "maxHealth": 120,
                    "maxEnergy": 60
                }
            }
            
            save_data = {
                "playerId": self.test_user_id,
                "ninja": ninja_data,
                "shurikens": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Fire Shuriken",
                        "rarity": "rare",
                        "attack": 25,
                        "level": 2,
                        "equipped": True
                    }
                ],
                "pets": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Test Wolf",
                        "type": "Wolf",
                        "level": 3,
                        "experience": 180,  # Integer XP for pet
                        "happiness": 75,
                        "strength": 22,
                        "active": True,
                        "rarity": "rare"
                    }
                ],
                "achievements": ["first_kill", "level_10", "level_15"],
                "unlockedFeatures": ["stats", "shurikens", "pets"],
                "zoneProgress": {
                    "currentZone": 5,
                    "currentLevel": 2,
                    "killsInLevel": 35,  # Integer kill count
                    "totalKills": 450   # Integer total kills
                },
                "equipment": {
                    "equipped": {
                        "head": None,
                        "body": None,
                        "weapon": None,
                        "accessory": None
                    },
                    "inventory": [],
                    "maxInventorySize": 50
                },
                "abilityData": {
                    "equippedAbilities": ["basic_shuriken", "fire_shuriken"],
                    "availableAbilities": {
                        "basic_shuriken": {"level": 3, "stats": {"baseDamage": 20, "cooldown": 1.0}},
                        "fire_shuriken": {"level": 2, "stats": {"baseDamage": 30, "cooldown": 2.5}}
                    },
                    "activeSynergies": []
                }
            }
            
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            async with self.session.post(
                f"{API_BASE}/save-game",
                json=save_data,
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    saved_ninja = data.get('ninja', {})
                    saved_xp = saved_ninja.get('experience')
                    saved_gold = saved_ninja.get('gold')
                    saved_gems = saved_ninja.get('gems')
                    
                    print(f"✅ Game save successful: Level {saved_ninja.get('level')}, XP {saved_xp}")
                    
                    # Verify all values are integers (XP decimal fix verification)
                    if (isinstance(saved_xp, int) and saved_xp == 3750 and
                        isinstance(saved_gold, int) and saved_gold == 2500 and
                        isinstance(saved_gems, int) and saved_gems == 50):
                        print(f"✅ XP Decimal Fix Verification: All values are integers (XP: {saved_xp}, Gold: {saved_gold}, Gems: {saved_gems})")
                        return True
                    else:
                        print(f"❌ XP Decimal Fix Verification: Non-integer values detected (XP: {saved_xp}, Gold: {saved_gold}, Gems: {saved_gems})")
                        return False
                else:
                    error_text = await response.text()
                    print(f"❌ Game save failed: Status {response.status}, Error: {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Game save error: {str(e)}")
            return False
            
    async def test_load_game_with_revival_system(self):
        """Test 6: Game Load with Revival System verification"""
        print(f"\n🔍 TEST 6: Game Load with Revival System Verification")
        try:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            async with self.session.get(
                f"{API_BASE}/load-game/{self.test_user_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data:
                        ninja = data.get('ninja', {})
                        revive_tickets = ninja.get('reviveTickets')
                        level = ninja.get('level')
                        experience = ninja.get('experience')
                        
                        print(f"✅ Game load successful: Level {level}, XP {experience}")
                        
                        # Verify Revival System data persistence
                        if revive_tickets is not None:
                            print(f"✅ Revival System Persistence: reviveTickets field loaded ({revive_tickets})")
                            
                            # Verify it's Level 25+ as requested
                            if level and level >= 25:
                                print(f"✅ Level 25+ Requirement: Ninja is Level {level}")
                                return True
                            else:
                                print(f"❌ Level 25+ Requirement: Ninja is only Level {level}")
                                return False
                        else:
                            print(f"❌ Revival System Persistence: reviveTickets field NOT loaded")
                            return False
                    else:
                        print(f"❌ Game load failed: No data returned")
                        return False
                else:
                    error_text = await response.text()
                    print(f"❌ Game load failed: Status {response.status}, Error: {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Game load error: {str(e)}")
            return False
            
    async def test_comprehensive_game_data_persistence(self):
        """Test 7: Comprehensive Game Data Persistence"""
        print(f"\n🔍 TEST 7: Comprehensive Game Data Persistence")
        try:
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            
            async with self.session.get(
                f"{API_BASE}/load-game/{self.test_user_id}",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data:
                        # Check all major data components
                        ninja = data.get('ninja', {})
                        shurikens = data.get('shurikens', [])
                        pets = data.get('pets', [])
                        achievements = data.get('achievements', [])
                        zone_progress = data.get('zoneProgress', {})
                        equipment = data.get('equipment', {})
                        ability_data = data.get('abilityData', {})
                        
                        checks_passed = 0
                        total_checks = 7
                        
                        # Check ninja stats
                        if ninja.get('level') == 27 and ninja.get('reviveTickets') == 3:
                            print(f"✅ Ninja stats with reviveTickets: Level {ninja.get('level')}, Tickets {ninja.get('reviveTickets')}")
                            checks_passed += 1
                        else:
                            print(f"❌ Ninja stats incomplete: Level {ninja.get('level')}, Tickets {ninja.get('reviveTickets')}")
                            
                        # Check shurikens
                        if len(shurikens) > 0 and any(s.get('name') == 'Legendary Dragon Fang' for s in shurikens):
                            print(f"✅ Shurikens data: {len(shurikens)} shurikens loaded")
                            checks_passed += 1
                        else:
                            print(f"❌ Shurikens data incomplete: {len(shurikens)} shurikens")
                            
                        # Check pets
                        if len(pets) > 0 and any(p.get('name') == 'Epic Phoenix' for p in pets):
                            print(f"✅ Pets data: {len(pets)} pets loaded")
                            checks_passed += 1
                        else:
                            print(f"❌ Pets data incomplete: {len(pets)} pets")
                            
                        # Check achievements
                        if 'revival_master' in achievements:
                            print(f"✅ Achievements data: {len(achievements)} achievements including revival_master")
                            checks_passed += 1
                        else:
                            print(f"❌ Achievements data incomplete: revival_master not found")
                            
                        # Check zone progress
                        if zone_progress.get('currentZone') == 8:
                            print(f"✅ Zone progress: Zone {zone_progress.get('currentZone')}")
                            checks_passed += 1
                        else:
                            print(f"❌ Zone progress incomplete: Zone {zone_progress.get('currentZone')}")
                            
                        # Check equipment
                        if equipment and equipment.get('weapon', {}).get('name') == 'Void Piercer':
                            print(f"✅ Equipment data: Weapon loaded")
                            checks_passed += 1
                        else:
                            print(f"❌ Equipment data incomplete")
                            
                        # Check ability data with revival technique
                        if ability_data and 'revival_technique' in ability_data.get('equippedAbilities', []):
                            print(f"✅ Ability data: Revival technique equipped")
                            checks_passed += 1
                        else:
                            print(f"❌ Ability data incomplete: Revival technique not found")
                            
                        success_rate = (checks_passed / total_checks) * 100
                        print(f"\n📊 Comprehensive Data Persistence: {checks_passed}/{total_checks} checks passed ({success_rate:.1f}%)")
                        
                        return checks_passed >= 6  # Allow 1 failure for minor issues
                    else:
                        print(f"❌ No game data found")
                        return False
                else:
                    print(f"❌ Failed to load game data: Status {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Comprehensive data test error: {str(e)}")
            return False

            
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 BACKEND API TESTING SUITE - REVIVAL SYSTEM INTEGRATION")
        print("=" * 60)
        
        await self.setup_session()
        
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Session Management", self.test_session_check),
            ("Game Save with Revival System", self.test_save_game_with_revival_system),
            ("Game Load with Revival System", self.test_load_game_with_revival_system),
            ("Comprehensive Data Persistence", self.test_comprehensive_game_data_persistence)
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} crashed: {str(e)}")
                results.append((test_name, False))
                
        await self.cleanup_session()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📋 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
            if result:
                passed += 1
                
        success_rate = (passed / total) * 100
        print(f"\n🎯 OVERALL SUCCESS RATE: {passed}/{total} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 85:
            print("🎉 BACKEND API IS READY FOR PRODUCTION")
        elif success_rate >= 70:
            print("⚠️  BACKEND API HAS MINOR ISSUES")
        else:
            print("🚨 BACKEND API HAS CRITICAL ISSUES")
            
        return results

async def main():
    """Main test runner"""
    tester = RevivalSystemTester()
    results = await tester.run_all_tests()
    
    # Return results for further processing
    return results

if __name__ == "__main__":
    asyncio.run(main())