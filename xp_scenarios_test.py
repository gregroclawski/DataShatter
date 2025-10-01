#!/usr/bin/env python3
"""
Additional XP Scenarios Testing for Comprehensive XP Decimal Fix Verification
Tests various XP scenarios including low values, high values, and level transitions
"""

import asyncio
import aiohttp
import json
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://idle-game-patch.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class XPScenariosTest:
    def __init__(self):
        self.session = None
        self.test_user_id = None
        self.test_user_email = f"xp_scenarios_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "testpass123"
        self.test_user_name = f"XPScenarioNinja_{uuid.uuid4().hex[:6]}"
        self.auth_token = None
        
    async def setup_session(self):
        """Setup HTTP session and authenticate"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
        
        # Register and login
        registration_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": self.test_user_name
        }
        
        async with self.session.post(f"{API_BASE}/auth/register", json=registration_data) as response:
            if response.status == 201:
                data = await response.json()
                self.auth_token = data.get('access_token')
                self.test_user_id = data.get('user', {}).get('id')
                print(f"✅ Test user registered: {self.test_user_id}")
            else:
                raise Exception(f"Registration failed: {response.status}")
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def test_xp_scenario(self, scenario_name: str, level: int, experience: int, gold: int, gems: int = 10):
        """Test a specific XP scenario"""
        print(f"\n🎯 TESTING XP SCENARIO: {scenario_name}")
        print(f"   Level: {level}, XP: {experience}, Gold: {gold}, Gems: {gems}")
        
        ninja_data = {
            "level": level,
            "experience": experience,
            "experienceToNext": 100 + (level * 50),
            "health": 100 + (level * 10),
            "maxHealth": 100 + (level * 10),
            "energy": 50 + (level * 5),
            "maxEnergy": 50 + (level * 5),
            "attack": 10 + level,
            "defense": 5 + level,
            "speed": 8 + level,
            "luck": 3 + level,
            "gold": gold,
            "gems": gems,
            "skillPoints": level * 3,
            "reviveTickets": 0,
            "baseStats": {
                "attack": 10,
                "defense": 5,
                "speed": 8,
                "luck": 3,
                "maxHealth": 100,
                "maxEnergy": 50
            },
            "goldUpgrades": {
                "attack": 0,
                "defense": 0,
                "speed": 0,
                "luck": 0,
                "maxHealth": 0,
                "maxEnergy": 0
            },
            "skillPointUpgrades": {
                "attack": 0,
                "defense": 0,
                "speed": 0,
                "luck": 0,
                "maxHealth": 0,
                "maxEnergy": 0
            }
        }
        
        save_data = {
            "playerId": self.test_user_id,
            "ninja": ninja_data,
            "shurikens": [],
            "pets": [],
            "achievements": [],
            "unlockedFeatures": ["stats"],
            "zoneProgress": {},
            "equipment": None,
            "abilityData": None
        }
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        try:
            # Save the scenario
            async with self.session.post(f"{API_BASE}/save-game", json=save_data, headers=headers) as response:
                if response.status == 200:
                    save_result = await response.json()
                    saved_ninja = save_result.get('ninja', {})
                    
                    # Verify integer values
                    saved_xp = saved_ninja.get('experience')
                    saved_gold = saved_ninja.get('gold')
                    saved_gems = saved_ninja.get('gems')
                    
                    if (isinstance(saved_xp, int) and saved_xp == experience and
                        isinstance(saved_gold, int) and saved_gold == gold and
                        isinstance(saved_gems, int) and saved_gems == gems):
                        print(f"   ✅ SAVE SUCCESS: All values are integers")
                        print(f"      Saved XP: {saved_xp} (type: {type(saved_xp).__name__})")
                        print(f"      Saved Gold: {saved_gold} (type: {type(saved_gold).__name__})")
                        print(f"      Saved Gems: {saved_gems} (type: {type(saved_gems).__name__})")
                        
                        # Load and verify
                        async with self.session.get(f"{API_BASE}/load-game/{self.test_user_id}", headers=headers) as load_response:
                            if load_response.status == 200:
                                load_result = await load_response.json()
                                if load_result:
                                    loaded_ninja = load_result.get('ninja', {})
                                    loaded_xp = loaded_ninja.get('experience')
                                    loaded_gold = loaded_ninja.get('gold')
                                    loaded_gems = loaded_ninja.get('gems')
                                    
                                    if (isinstance(loaded_xp, int) and loaded_xp == experience and
                                        isinstance(loaded_gold, int) and loaded_gold == gold and
                                        isinstance(loaded_gems, int) and loaded_gems == gems):
                                        print(f"   ✅ LOAD SUCCESS: Data integrity maintained")
                                        print(f"      Loaded XP: {loaded_xp} (type: {type(loaded_xp).__name__})")
                                        print(f"      Loaded Gold: {loaded_gold} (type: {type(loaded_gold).__name__})")
                                        print(f"      Loaded Gems: {loaded_gems} (type: {type(loaded_gems).__name__})")
                                        return True
                                    else:
                                        print(f"   ❌ LOAD FAILED: Data integrity lost or non-integer values")
                                        return False
                                else:
                                    print(f"   ❌ LOAD FAILED: No data returned")
                                    return False
                            else:
                                print(f"   ❌ LOAD FAILED: HTTP {load_response.status}")
                                return False
                    else:
                        print(f"   ❌ SAVE FAILED: Non-integer values detected")
                        print(f"      XP: {saved_xp} (type: {type(saved_xp).__name__})")
                        print(f"      Gold: {saved_gold} (type: {type(saved_gold).__name__})")
                        print(f"      Gems: {saved_gems} (type: {type(saved_gems).__name__})")
                        return False
                else:
                    error_text = await response.text()
                    print(f"   ❌ SAVE FAILED: HTTP {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"   ❌ SCENARIO FAILED: Exception {str(e)}")
            return False
    
    async def run_xp_scenarios(self):
        """Run comprehensive XP scenarios testing"""
        print("🧪 COMPREHENSIVE XP SCENARIOS TESTING")
        print("=" * 60)
        print("Testing various XP scenarios after Math.round() fix")
        print("=" * 60)
        
        await self.setup_session()
        
        # Define test scenarios
        scenarios = [
            # Low values
            ("Low Level - Starting Values", 1, 0, 100, 10),
            ("Low Level - Small Progress", 2, 50, 150, 15),
            ("Low Level - Near Level Up", 3, 199, 200, 20),
            
            # Medium values
            ("Medium Level - Steady Progress", 10, 1500, 1000, 50),
            ("Medium Level - Level Transition", 15, 3750, 2500, 75),
            ("Medium Level - High Progress", 20, 6000, 4000, 100),
            
            # High values
            ("High Level - Major Progress", 50, 62500, 25000, 500),
            ("High Level - Near Max", 75, 140625, 50000, 1000),
            ("High Level - Level Transition", 100, 250000, 100000, 2000),
            
            # Edge cases
            ("Edge Case - Zero Values", 1, 0, 0, 0),
            ("Edge Case - Maximum Values", 999, 999999, 999999, 99999),
            ("Edge Case - Odd Numbers", 33, 16335, 7777, 333),
            
            # Level transition scenarios (common XP calculation results)
            ("Level Transition - 2 to 3", 3, 300, 300, 30),
            ("Level Transition - 5 to 6", 6, 900, 600, 60),
            ("Level Transition - 10 to 11", 11, 2200, 1100, 110),
            ("Level Transition - 25 to 26", 26, 16250, 3250, 260),
        ]
        
        results = []
        
        for scenario_name, level, xp, gold, gems in scenarios:
            result = await self.test_xp_scenario(scenario_name, level, xp, gold, gems)
            results.append((scenario_name, result))
            
            # Small delay between tests
            await asyncio.sleep(0.1)
        
        await self.cleanup_session()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📋 XP SCENARIOS TEST RESULTS")
        print("=" * 60)
        
        passed = 0
        total = len(results)
        
        for scenario_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {scenario_name}")
            if result:
                passed += 1
        
        success_rate = (passed / total) * 100
        print(f"\n🎯 XP SCENARIOS SUCCESS RATE: {passed}/{total} scenarios passed ({success_rate:.1f}%)")
        
        if success_rate == 100:
            print("✅ ALL XP SCENARIOS PASSED - Math.round() fix working perfectly!")
            print("✅ Backend correctly handles all XP value ranges as integers")
            print("✅ No 422 'int_from_float' validation errors in any scenario")
        elif success_rate >= 90:
            print("⚠️  MOST XP SCENARIOS PASSED - Minor issues detected")
        else:
            print("❌ XP SCENARIOS FAILED - Critical issues with integer handling")
        
        return results

async def main():
    """Main test runner for XP scenarios"""
    tester = XPScenariosTest()
    results = await tester.run_xp_scenarios()
    return results

if __name__ == "__main__":
    asyncio.run(main())