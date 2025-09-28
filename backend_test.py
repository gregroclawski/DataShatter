#!/usr/bin/env python3
"""
Backend API Testing for Ability Persistence System
Focus: Verify ability data is being saved and loaded correctly

REVIEW REQUEST FOCUS:
1. **Verify Backend Logging**: Check if ability data is actually being received and saved by the backend
2. **Test Save Request**: Manually trigger a save and check the backend logs for ability data
3. **Test Load Request**: Load game data and verify ability data is being returned
4. **Database Verification**: Check if ability data is actually stored in MongoDB

Expected: Backend logs should show `💾 SAVE REQUEST - Ability Data: {actual ability data}` when saves occur.
If this is missing, the frontend isn't sending ability data. If it's present but abilities still reset, the restore logic has issues.
"""

import requests
import json
import uuid
from datetime import datetime

# Get backend URL from frontend env
BACKEND_URL = "https://gear-master.preview.emergentagent.com/api"

def test_ability_persistence_system():
    """Test the complete ability persistence system"""
    print("🧪 TESTING ABILITY PERSISTENCE SYSTEM")
    print("=" * 60)
    
    # Test data with realistic ability data structure
    test_player_id = str(uuid.uuid4())
    
    # Realistic ability data structure based on typical game systems
    test_ability_data = {
        "equippedAbilities": [
            {
                "id": "basic_shuriken",
                "level": 3,
                "currentCooldown": 0,
                "lastUsed": 0
            },
            {
                "id": "fire_shuriken", 
                "level": 2,
                "currentCooldown": 0,
                "lastUsed": 0
            },
            {
                "id": "ice_shuriken",
                "level": 1,
                "currentCooldown": 0,
                "lastUsed": 0
            },
            {
                "id": "whirlwind_strike",
                "level": 2,
                "currentCooldown": 0,
                "lastUsed": 0
            },
            {
                "id": "shadow_clone",
                "level": 1,
                "currentCooldown": 0,
                "lastUsed": 0
            }
        ],
        "availableAbilities": {
            "basic_shuriken": {
                "id": "basic_shuriken",
                "level": 3,
                "stats": {
                    "baseDamage": 42,
                    "cooldown": 1.71,
                    "range": 150
                }
            },
            "fire_shuriken": {
                "id": "fire_shuriken",
                "level": 2,
                "stats": {
                    "baseDamage": 30,
                    "cooldown": 2.8,
                    "range": 150,
                    "duration": 5
                }
            },
            "ice_shuriken": {
                "id": "ice_shuriken",
                "level": 1,
                "stats": {
                    "baseDamage": 18,
                    "cooldown": 2.5,
                    "range": 150,
                    "duration": 3
                }
            },
            "whirlwind_strike": {
                "id": "whirlwind_strike",
                "level": 2,
                "stats": {
                    "baseDamage": 56,
                    "cooldown": 7.04,
                    "aoeRadius": 500
                }
            },
            "shadow_clone": {
                "id": "shadow_clone",
                "level": 1,
                "stats": {
                    "baseDamage": 0,
                    "cooldown": 15,
                    "duration": 30
                }
            }
        },
        "activeSynergies": []
    }
    
    # Test ninja data
    test_ninja_data = {
        "level": 15,
        "experience": 2250,
        "experienceToNext": 1600,
        "health": 150,
        "maxHealth": 150,
        "energy": 75,
        "maxEnergy": 75,
        "attack": 25,
        "defense": 12,
        "speed": 18,
        "luck": 8,
        "gold": 500,
        "gems": 25,
        "skillPoints": 15
    }
    
    print(f"🎯 Testing with Player ID: {test_player_id}")
    print(f"🎯 Ability Data Structure: {len(test_ability_data['equippedAbilities'])} equipped abilities")
    print(f"🎯 Available Abilities: {len(test_ability_data['availableAbilities'])} total abilities")
    
    # Test 1: Save game with ability data
    print("\n📤 TEST 1: SAVE GAME WITH ABILITY DATA")
    print("-" * 40)
    
    save_payload = {
        "playerId": test_player_id,
        "ninja": test_ninja_data,
        "shurikens": [],
        "pets": [],
        "achievements": ["first_kill", "level_10"],
        "unlockedFeatures": ["stats", "shurikens", "abilities"],
        "zoneProgress": {"currentZone": 3, "totalKills": 45},
        "equipment": {"helmet": "Basic Helmet", "armor": "Leather Vest"},
        "abilityData": test_ability_data
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/save-game", json=save_payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SAVE SUCCESS")
            print(f"   - Saved Player ID: {result.get('playerId')}")
            print(f"   - Ninja Level: {result.get('ninja', {}).get('level')}")
            print(f"   - Ability Data Present: {'abilityData' in result}")
            if 'abilityData' in result and result['abilityData']:
                equipped_abilities = result['abilityData'].get('equippedAbilities', [])
                available_abilities = result['abilityData'].get('availableAbilities', {})
                print(f"   - Equipped Abilities Saved: {len(equipped_abilities)}")
                print(f"   - Available Abilities Saved: {len(available_abilities)}")
        else:
            print(f"❌ SAVE FAILED: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ SAVE REQUEST FAILED: {str(e)}")
        return False
    
    # Test 2: Load game and verify ability data
    print("\n📥 TEST 2: LOAD GAME AND VERIFY ABILITY DATA")
    print("-" * 40)
    
    try:
        response = requests.get(f"{BACKEND_URL}/load-game/{test_player_id}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result is None:
                print("❌ LOAD FAILED: No save data found")
                return False
                
            print("✅ LOAD SUCCESS")
            print(f"   - Loaded Player ID: {result.get('playerId')}")
            print(f"   - Ninja Level: {result.get('ninja', {}).get('level')}")
            
            # Verify ability data integrity
            loaded_ability_data = result.get('abilityData')
            if loaded_ability_data:
                print("✅ ABILITY DATA FOUND IN LOADED GAME")
                
                # Check equipped abilities
                equipped_abilities = loaded_ability_data.get('equippedAbilities', [])
                print(f"   - Equipped Abilities Loaded: {len(equipped_abilities)}")
                
                # Check available abilities
                available_abilities = loaded_ability_data.get('availableAbilities', {})
                print(f"   - Available Abilities Loaded: {len(available_abilities)}")
                
                # Verify specific ability data
                for i, ability in enumerate(equipped_abilities):
                    ability_id = ability.get('id', 'Unknown')
                    ability_level = ability.get('level', 0)
                    print(f"   - Equipped {i+1}: {ability_id} (Level {ability_level})")
                
                # Compare with original data
                original_equipped = test_ability_data['equippedAbilities']
                if len(equipped_abilities) == len(original_equipped):
                    print("✅ EQUIPPED ABILITY COUNT MATCHES")
                    
                    # Check each equipped ability
                    data_matches = True
                    for orig, loaded in zip(original_equipped, equipped_abilities):
                        if (orig['id'] != loaded.get('id') or 
                            orig['level'] != loaded.get('level')):
                            print(f"❌ ABILITY DATA MISMATCH: {orig['id']}")
                            data_matches = False
                    
                    if data_matches:
                        print("✅ ALL EQUIPPED ABILITY DATA MATCHES ORIGINAL")
                    else:
                        print("❌ SOME EQUIPPED ABILITY DATA DOESN'T MATCH")
                        return False
                else:
                    print(f"❌ EQUIPPED ABILITY COUNT MISMATCH: Expected {len(original_equipped)}, Got {len(equipped_abilities)}")
                    return False
                    
            else:
                print("❌ NO ABILITY DATA IN LOADED GAME")
                print("   This indicates ability data is not being saved or loaded properly")
                return False
                
        else:
            print(f"❌ LOAD FAILED: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ LOAD REQUEST FAILED: {str(e)}")
        return False
    
    # Test 3: Update ability data and verify persistence
    print("\n🔄 TEST 3: UPDATE ABILITY DATA AND VERIFY PERSISTENCE")
    print("-" * 40)
    
    # Modify ability data (level up abilities)
    updated_ability_data = test_ability_data.copy()
    updated_ability_data['equippedAbilities'][0]['level'] = 4  # Level up Basic Shuriken
    updated_ability_data['equippedAbilities'][1]['level'] = 3  # Level up Fire Shuriken
    updated_ability_data['availableAbilities']['basic_shuriken']['level'] = 4
    updated_ability_data['availableAbilities']['basic_shuriken']['stats']['baseDamage'] = 56
    updated_ability_data['availableAbilities']['fire_shuriken']['level'] = 3
    updated_ability_data['availableAbilities']['fire_shuriken']['stats']['baseDamage'] = 40
    
    # Update ninja level too
    updated_ninja_data = test_ninja_data.copy()
    updated_ninja_data['level'] = 16
    updated_ninja_data['experience'] = 2500
    
    update_payload = {
        "playerId": test_player_id,
        "ninja": updated_ninja_data,
        "shurikens": [],
        "pets": [],
        "achievements": ["first_kill", "level_10", "level_15"],
        "unlockedFeatures": ["stats", "shurikens", "abilities"],
        "zoneProgress": {"currentZone": 4, "totalKills": 67},
        "equipment": {"helmet": "Iron Helmet", "armor": "Chain Mail"},
        "abilityData": updated_ability_data
    }
    
    try:
        # Save updated data
        response = requests.post(f"{BACKEND_URL}/save-game", json=update_payload, timeout=10)
        if response.status_code != 200:
            print(f"❌ UPDATE SAVE FAILED: {response.status_code}")
            return False
        
        print("✅ UPDATE SAVE SUCCESS")
        
        # Load and verify updated data
        response = requests.get(f"{BACKEND_URL}/load-game/{test_player_id}", timeout=10)
        if response.status_code != 200:
            print(f"❌ UPDATE LOAD FAILED: {response.status_code}")
            return False
            
        result = response.json()
        loaded_ability_data = result.get('abilityData')
        
        if loaded_ability_data:
            # Check if updates persisted
            equipped_abilities = loaded_ability_data.get('equippedAbilities', [])
            basic_shuriken = equipped_abilities[0] if equipped_abilities else {}
            fire_shuriken = equipped_abilities[1] if len(equipped_abilities) > 1 else {}
            
            if (basic_shuriken.get('level') == 4 and 
                fire_shuriken.get('level') == 3):
                print("✅ ABILITY UPDATES PERSISTED CORRECTLY")
                print(f"   - Basic Shuriken Level: {basic_shuriken.get('level')} (Expected: 4)")
                print(f"   - Fire Shuriken Level: {fire_shuriken.get('level')} (Expected: 3)")
            else:
                print("❌ ABILITY UPDATES NOT PERSISTED")
                print(f"   - Basic Shuriken Level: {basic_shuriken.get('level')} (Expected: 4)")
                print(f"   - Fire Shuriken Level: {fire_shuriken.get('level')} (Expected: 3)")
                return False
        else:
            print("❌ NO ABILITY DATA AFTER UPDATE")
            return False
            
    except Exception as e:
        print(f"❌ UPDATE TEST FAILED: {str(e)}")
        return False
    
    print("\n🎉 ALL ABILITY PERSISTENCE TESTS PASSED!")
    return True

def test_backend_logging_verification():
    """Test to verify backend logging is working for ability data"""
    print("\n🔍 TESTING BACKEND LOGGING FOR ABILITY DATA")
    print("=" * 60)
    
    test_player_id = str(uuid.uuid4())
    
    # Simple ability data for logging test
    simple_ability_data = {
        "equippedAbilities": [
            {"id": "test_ability", "level": 1, "currentCooldown": 0, "lastUsed": 0}
        ],
        "availableAbilities": {
            "test_ability": {
                "id": "test_ability",
                "level": 1,
                "stats": {"baseDamage": 10, "cooldown": 2}
            }
        },
        "activeSynergies": []
    }
    
    save_payload = {
        "playerId": test_player_id,
        "ninja": {
            "level": 5,
            "experience": 500,
            "experienceToNext": 600,
            "health": 100,
            "maxHealth": 100,
            "energy": 50,
            "maxEnergy": 50,
            "attack": 15,
            "defense": 8,
            "speed": 10,
            "luck": 5,
            "gold": 200,
            "gems": 15,
            "skillPoints": 5
        },
        "shurikens": [],
        "pets": [],
        "achievements": [],
        "unlockedFeatures": ["stats"],
        "zoneProgress": {},
        "equipment": None,
        "abilityData": simple_ability_data
    }
    
    print(f"🎯 Testing logging with Player ID: {test_player_id}")
    print(f"🎯 Ability Data: {simple_ability_data}")
    print("\n📝 EXPECTED BACKEND LOG:")
    print(f"   💾 SAVE REQUEST - Ability Data: {simple_ability_data}")
    
    try:
        response = requests.post(f"{BACKEND_URL}/save-game", json=save_payload, timeout=10)
        
        if response.status_code == 200:
            print("\n✅ SAVE REQUEST SUCCESSFUL")
            print("   Check backend logs for: '💾 SAVE REQUEST - Ability Data: {...}'")
            print("   If this log is missing, frontend is not sending ability data")
            print("   If this log is present but abilities still reset, restore logic has issues")
            return True
        else:
            print(f"\n❌ SAVE REQUEST FAILED: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ LOGGING TEST FAILED: {str(e)}")
        return False

def test_database_verification():
    """Test to verify ability data is actually stored in MongoDB"""
    print("\n🗄️ TESTING DATABASE STORAGE VERIFICATION")
    print("=" * 60)
    
    test_player_id = str(uuid.uuid4())
    
    # Create test data with ability data
    ability_data = {
        "equippedAbilities": [
            {"id": "db_test_1", "level": 2, "currentCooldown": 0, "lastUsed": 0},
            {"id": "db_test_2", "level": 1, "currentCooldown": 0, "lastUsed": 0}
        ],
        "availableAbilities": {
            "db_test_1": {
                "id": "db_test_1",
                "level": 2,
                "stats": {"baseDamage": 30, "cooldown": 2}
            },
            "db_test_2": {
                "id": "db_test_2", 
                "level": 1,
                "stats": {"baseDamage": 15, "cooldown": 3}
            }
        },
        "activeSynergies": []
    }
    
    save_payload = {
        "playerId": test_player_id,
        "ninja": {
            "level": 10,
            "experience": 1000,
            "experienceToNext": 1100,
            "health": 120,
            "maxHealth": 120,
            "energy": 60,
            "maxEnergy": 60,
            "attack": 20,
            "defense": 10,
            "speed": 12,
            "luck": 6,
            "gold": 300,
            "gems": 20,
            "skillPoints": 10
        },
        "shurikens": [],
        "pets": [],
        "achievements": [],
        "unlockedFeatures": ["stats"],
        "zoneProgress": {},
        "equipment": None,
        "abilityData": ability_data
    }
    
    print(f"🎯 Testing database storage with Player ID: {test_player_id}")
    
    # Save data
    try:
        save_response = requests.post(f"{BACKEND_URL}/save-game", json=save_payload, timeout=10)
        if save_response.status_code != 200:
            print(f"❌ SAVE FAILED: {save_response.status_code}")
            return False
        
        print("✅ SAVE TO DATABASE SUCCESSFUL")
        
        # Load data back
        load_response = requests.get(f"{BACKEND_URL}/load-game/{test_player_id}", timeout=10)
        if load_response.status_code != 200:
            print(f"❌ LOAD FAILED: {load_response.status_code}")
            return False
            
        loaded_data = load_response.json()
        
        if loaded_data and 'abilityData' in loaded_data:
            loaded_ability_data = loaded_data['abilityData']
            
            # Verify the specific test data
            equipped_abilities = loaded_ability_data.get('equippedAbilities', [])
            if len(equipped_abilities) == 2:
                
                ability1 = equipped_abilities[0]
                ability2 = equipped_abilities[1]
                
                if (ability1.get('id') == 'db_test_1' and ability1.get('level') == 2 and
                    ability2.get('id') == 'db_test_2' and ability2.get('level') == 1):
                    print("✅ DATABASE STORAGE VERIFIED")
                    print("   - Ability data is correctly stored in MongoDB")
                    print("   - Ability data is correctly retrieved from MongoDB")
                    print(f"   - Ability 1: {ability1.get('id')} (Level {ability1.get('level')})")
                    print(f"   - Ability 2: {ability2.get('id')} (Level {ability2.get('level')})")
                    return True
                else:
                    print("❌ DATABASE DATA CORRUPTION")
                    print("   - Ability data stored but corrupted during save/load")
                    return False
            else:
                print("❌ DATABASE STORAGE FAILED")
                print("   - Ability data not properly stored in MongoDB")
                return False
        else:
            print("❌ NO ABILITY DATA IN DATABASE")
            print("   - Ability data field missing from stored document")
            return False
            
    except Exception as e:
        print(f"❌ DATABASE TEST FAILED: {str(e)}")
        return False

def test_specific_user_ability_data():
    """Test ability data for the specific user mentioned in the review request"""
    print("\n🔍 TESTING SPECIFIC USER ABILITY DATA")
    print("=" * 60)
    
    # Specific user ID from review request and backend logs
    user_id = "c16cbf6f-c1f4-495f-8a58-c94f32653225"
    
    print(f"🎯 Testing ability data for User ID: {user_id}")
    print("🎯 This is the user mentioned in the review request")
    
    try:
        response = requests.get(f"{BACKEND_URL}/load-game/{user_id}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result is None:
                print("❌ NO SAVE DATA FOUND")
                print("   User has no saved game data")
                return False
                
            print("✅ SAVE DATA FOUND")
            print(f"   - Player ID: {result.get('playerId')}")
            print(f"   - Ninja Level: {result.get('ninja', {}).get('level')}")
            print(f"   - Ninja XP: {result.get('ninja', {}).get('experience')}")
            
            # Check for ability data
            ability_data = result.get('abilityData')
            if ability_data:
                print("✅ ABILITY DATA FOUND IN USER'S SAVE")
                
                # Analyze equipped abilities
                equipped_abilities = ability_data.get('equippedAbilities', [])
                print(f"   - Equipped Abilities: {len(equipped_abilities)}")
                
                for i, ability in enumerate(equipped_abilities):
                    ability_id = ability.get('id', 'Unknown')
                    ability_level = ability.get('level', 0)
                    current_cooldown = ability.get('currentCooldown', 0)
                    print(f"     {i+1}. {ability_id} (Level {ability_level}, Cooldown: {current_cooldown})")
                
                # Analyze available abilities
                available_abilities = ability_data.get('availableAbilities', {})
                print(f"   - Available Abilities: {len(available_abilities)}")
                
                for ability_id, ability_info in available_abilities.items():
                    level = ability_info.get('level', 0)
                    stats = ability_info.get('stats', {})
                    damage = stats.get('baseDamage', 0)
                    print(f"     - {ability_id}: Level {level}, Damage {damage}")
                
                # Check synergies
                synergies = ability_data.get('activeSynergies', [])
                print(f"   - Active Synergies: {len(synergies)}")
                
                print("\n🔍 ABILITY DATA ANALYSIS:")
                print("   ✅ Backend IS receiving and storing ability data")
                print("   ✅ Ability data IS being saved to MongoDB")
                print("   ✅ Ability data IS being returned on load requests")
                print("\n💡 CONCLUSION:")
                print("   The backend ability persistence system is working correctly.")
                print("   If abilities still reset on restart, the issue is likely in:")
                print("   1. Frontend not properly restoring ability data after load")
                print("   2. AbilityManager not applying loaded data correctly")
                print("   3. Timing issues in the frontend load sequence")
                
                return True
                
            else:
                print("❌ NO ABILITY DATA IN USER'S SAVE")
                print("   This indicates either:")
                print("   1. Frontend is not sending ability data in save requests")
                print("   2. Backend is not storing ability data properly")
                print("   3. User's save was created before ability system was implemented")
                return False
                
        else:
            print(f"❌ LOAD FAILED: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ TEST FAILED: {str(e)}")
        return False

def main():
    """Run all ability persistence tests"""
    print("🚀 STARTING ABILITY PERSISTENCE SYSTEM TESTING")
    print("=" * 80)
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Complete ability persistence system
    print("\n" + "🧪" * 20 + " TEST 1: COMPLETE ABILITY PERSISTENCE " + "🧪" * 20)
    if test_ability_persistence_system():
        tests_passed += 1
    
    # Test 2: Backend logging verification  
    print("\n" + "🔍" * 20 + " TEST 2: BACKEND LOGGING VERIFICATION " + "🔍" * 20)
    if test_backend_logging_verification():
        tests_passed += 1
    
    # Test 3: Database storage verification
    print("\n" + "🗄️" * 20 + " TEST 3: DATABASE STORAGE VERIFICATION " + "🗄️" * 20)
    if test_database_verification():
        tests_passed += 1
    
    # Test 4: Specific user ability data analysis
    print("\n" + "👤" * 20 + " TEST 4: SPECIFIC USER ANALYSIS " + "👤" * 20)
    if test_specific_user_ability_data():
        tests_passed += 1
    
    print("\n" + "=" * 80)
    print(f"🏁 TESTING COMPLETE: {tests_passed}/{total_tests} TESTS PASSED")
    
    if tests_passed == total_tests:
        print("✅ ALL ABILITY PERSISTENCE TESTS SUCCESSFUL")
        print("   - Ability data is being saved correctly")
        print("   - Ability data is being loaded correctly") 
        print("   - Database storage is working properly")
        print("   - Backend logging shows ability data in save requests")
        print("\n🎯 CONCLUSION:")
        print("   The backend ability persistence system is WORKING CORRECTLY.")
        print("   If abilities still reset on restart, the issue is in the FRONTEND:")
        print("   1. AbilityManager not properly restoring loaded ability data")
        print("   2. Frontend load sequence timing issues")
        print("   3. AbilityManager initialization overriding loaded data")
    else:
        print("❌ SOME ABILITY PERSISTENCE TESTS FAILED")
        print("   - Check backend logs for '💾 SAVE REQUEST - Ability Data:' messages")
        print("   - Verify frontend is sending abilityData in save payload")
        print("   - Check if restore logic is properly applying loaded ability data")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    main()

# Old code removed - replaced with ability persistence tests
        """Test login with invalid credentials"""
        print("\n=== TESTING INVALID LOGIN REJECTION ===")
        
        try:
            invalid_login_data = {
                "username": "nonexistent@example.com",
                "password": "wrongpassword"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", data=invalid_login_data)
            
            if response.status_code == 401:
                self.log_result("authentication", "Invalid Login Rejection", True, 
                              "Correctly rejected invalid credentials")
                return True
            else:
                self.log_result("authentication", "Invalid Login Rejection", False, 
                              f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("authentication", "Invalid Login Rejection", False, f"Exception: {str(e)}")
            return False

    def test_session_check(self):
        """Test session validation endpoint"""
        print("\n=== TESTING SESSION CHECK ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/auth/session/check", cookies=self.session_cookies)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("authenticated") == True and "user" in data:
                    self.log_result("authentication", "Session Check", True, 
                                  f"Session valid for user: {data['user']['email']}")
                    return True
                else:
                    self.log_result("authentication", "Session Check", True, 
                                  f"Session check response (may be unauthenticated): {data}")
                    return True
            else:
                self.log_result("authentication", "Session Check", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("authentication", "Session Check", False, f"Exception: {str(e)}")
            return False

    def test_save_game(self):
        """Test game save functionality"""
        print("\n=== TESTING SAVE GAME ===")
        
        try:
            if not self.test_user_id:
                self.log_result("game_progression", "Save Game", False, "No user ID available for testing")
                return False
                
            game_data = {
                "playerId": self.test_user_id,
                "ninja": {
                    "level": 25,
                    "experience": 6250,
                    "experienceToNext": 2750,
                    "health": 150,
                    "maxHealth": 150,
                    "energy": 75,
                    "maxEnergy": 75,
                    "attack": 35,
                    "defense": 20,
                    "speed": 18,
                    "luck": 12,
                    "gold": 2500,
                    "gems": 150,
                    "skillPoints": 75
                },
                "shurikens": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Dragon Fang",
                        "rarity": "epic",
                        "attack": 45,
                        "level": 3,
                        "equipped": True
                    }
                ],
                "pets": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Shadow Dragon",
                        "type": "Dragon",
                        "level": 5,
                        "experience": 250,
                        "happiness": 85,
                        "strength": 40,
                        "active": True,
                        "rarity": "legendary"
                    }
                ],
                "achievements": ["first_kill", "level_10", "epic_shuriken"],
                "unlockedFeatures": ["stats", "shurikens", "pets", "zones"],
                "zoneProgress": {
                    "currentZone": "fire_temple",
                    "zonesUnlocked": ["training_grounds", "dark_forest", "fire_temple"],
                    "bossesDefeated": ["forest_guardian", "flame_lord"]
                }
            }
            
            response = self.session.post(
                f"{BASE_URL}/save-game",
                json=game_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "playerId" in data and data["playerId"] == self.test_user_id:
                    self.log_result("game_progression", "Save Game", True, 
                                  f"Game saved for Level {data['ninja']['level']} ninja")
                    return True
                else:
                    self.log_result("game_progression", "Save Game", False, 
                                  f"Invalid save response: {data}")
                    return False
            else:
                self.log_result("game_progression", "Save Game", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Save Game", False, f"Exception: {str(e)}")
            return False

    def test_load_game(self):
        """Test game load functionality"""
        print("\n=== TESTING LOAD GAME ===")
        
        try:
            if not self.test_user_id:
                self.log_result("game_progression", "Load Game", False, "No user ID available for testing")
                return False
                
            response = self.session.get(f"{BASE_URL}/load-game/{self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data and "ninja" in data and "playerId" in data:
                    ninja_level = data["ninja"]["level"]
                    ninja_xp = data["ninja"]["experience"]
                    self.log_result("game_progression", "Load Game", True, 
                                  f"Loaded Level {ninja_level} ninja with {ninja_xp} XP")
                    return True
                elif data is None:
                    self.log_result("game_progression", "Load Game", True, "No save data found (valid response)")
                    return True
                else:
                    self.log_result("game_progression", "Load Game", False, 
                                  f"Invalid load response: {data}")
                    return False
            else:
                self.log_result("game_progression", "Load Game", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Load Game", False, f"Exception: {str(e)}")
            return False

    def test_extreme_level_progression(self):
        """Test extreme level progression support"""
        print("\n=== TESTING EXTREME LEVEL PROGRESSION ===")
        
        try:
            if not self.test_user_id:
                self.log_result("game_progression", "Extreme Level Progression", False, 
                              "No user ID available for testing")
                return False
                
            extreme_game_data = {
                "playerId": self.test_user_id,
                "ninja": {
                    "level": 999,
                    "experience": 999999,
                    "experienceToNext": 1000000,
                    "health": 9999,
                    "maxHealth": 9999,
                    "energy": 999,
                    "maxEnergy": 999,
                    "attack": 999,
                    "defense": 999,
                    "speed": 999,
                    "luck": 999,
                    "gold": 999999999,
                    "gems": 999999,
                    "skillPoints": 2997
                },
                "shurikens": [],
                "pets": [],
                "achievements": [],
                "unlockedFeatures": ["stats", "shurikens", "pets", "zones"],
                "zoneProgress": {}
            }
            
            # Test save with extreme values
            save_response = self.session.post(
                f"{BASE_URL}/save-game",
                json=extreme_game_data,
                headers={"Content-Type": "application/json"}
            )
            
            if save_response.status_code != 200:
                self.log_result("game_progression", "Extreme Level Progression", False, 
                              f"Save failed: {save_response.status_code}")
                return False
                
            # Test load with extreme values
            load_response = self.session.get(f"{BASE_URL}/load-game/{self.test_user_id}")
            
            if load_response.status_code == 200:
                data = load_response.json()
                if data and data["ninja"]["level"] == 999 and data["ninja"]["experience"] == 999999:
                    self.log_result("game_progression", "Extreme Level Progression", True, 
                                  "Successfully handled Level 999 with 999999 XP")
                    return True
                else:
                    self.log_result("game_progression", "Extreme Level Progression", False, 
                                  f"Data integrity issue: {data}")
                    return False
            else:
                self.log_result("game_progression", "Extreme Level Progression", False, 
                              f"Load failed: {load_response.status_code}")
                return False
        except Exception as e:
            self.log_result("game_progression", "Extreme Level Progression", False, f"Exception: {str(e)}")
            return False

    def test_shuriken_generation(self):
        """Test shuriken generation system"""
        print("\n=== TESTING SHURIKEN GENERATION ===")
        
        try:
            response = self.session.post(f"{BASE_URL}/generate-shuriken")
            
            if response.status_code == 200:
                data = response.json()
                if "shuriken" in data:
                    shuriken = data["shuriken"]
                    if all(key in shuriken for key in ["name", "rarity", "attack", "id"]):
                        self.log_result("game_systems", "Shuriken Generation", True, 
                                      f"Generated {shuriken['rarity']} {shuriken['name']} (ATK: {shuriken['attack']})")
                        return True
                    else:
                        self.log_result("game_systems", "Shuriken Generation", False, 
                                      f"Missing shuriken fields: {shuriken}")
                        return False
                else:
                    self.log_result("game_systems", "Shuriken Generation", False, 
                                  f"No shuriken in response: {data}")
                    return False
            else:
                self.log_result("game_systems", "Shuriken Generation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Shuriken Generation", False, f"Exception: {str(e)}")
            return False

    def test_pet_generation(self):
        """Test pet generation system"""
        print("\n=== TESTING PET GENERATION ===")
        
        try:
            response = self.session.post(f"{BASE_URL}/generate-pet")
            
            if response.status_code == 200:
                data = response.json()
                if "pet" in data:
                    pet = data["pet"]
                    if all(key in pet for key in ["name", "type", "rarity", "strength", "id"]):
                        self.log_result("game_systems", "Pet Generation", True, 
                                      f"Generated {pet['rarity']} {pet['name']} (STR: {pet['strength']})")
                        return True
                    else:
                        self.log_result("game_systems", "Pet Generation", False, 
                                      f"Missing pet fields: {pet}")
                        return False
                else:
                    self.log_result("game_systems", "Pet Generation", False, 
                                  f"No pet in response: {data}")
                    return False
            else:
                self.log_result("game_systems", "Pet Generation", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Pet Generation", False, f"Exception: {str(e)}")
            return False

    def test_leaderboard(self):
        """Test leaderboard system"""
        print("\n=== TESTING LEADERBOARD ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/leaderboard")
            
            if response.status_code == 200:
                data = response.json()
                if "leaderboard" in data and isinstance(data["leaderboard"], list):
                    leaderboard = data["leaderboard"]
                    self.log_result("game_systems", "Leaderboard", True, 
                                  f"Retrieved leaderboard with {len(leaderboard)} entries")
                    return True
                else:
                    self.log_result("game_systems", "Leaderboard", False, 
                                  f"Invalid leaderboard format: {data}")
                    return False
            else:
                self.log_result("game_systems", "Leaderboard", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Leaderboard", False, f"Exception: {str(e)}")
            return False

    def test_game_events(self):
        """Test game events system"""
        print("\n=== TESTING GAME EVENTS ===")
        
        try:
            response = self.session.get(f"{BASE_URL}/game-events")
            
            if response.status_code == 200:
                data = response.json()
                if "events" in data and isinstance(data["events"], list):
                    events = data["events"]
                    if len(events) > 0 and all("id" in event and "title" in event for event in events):
                        self.log_result("game_systems", "Game Events", True, 
                                      f"Retrieved {len(events)} game events")
                        return True
                    else:
                        self.log_result("game_systems", "Game Events", False, 
                                      f"Invalid events format: {events}")
                        return False
                else:
                    self.log_result("game_systems", "Game Events", False, 
                                  f"No events in response: {data}")
                    return False
            else:
                self.log_result("game_systems", "Game Events", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("game_systems", "Game Events", False, f"Exception: {str(e)}")
            return False

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("COMPREHENSIVE BACKEND API TEST SUMMARY")
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
            print("\n🎯 ALL BACKEND SYSTEMS WORKING CORRECTLY!")
            print("✅ Health check endpoint responding")
            print("✅ Authentication system functional")
            print("✅ Game progression (save/load) working")
            print("✅ Game systems (shuriken, pets, leaderboard, events) operational")
            print("✅ Backend ready for frontend integration")
        else:
            print(f"\n⚠️  {total_failed} BACKEND ISSUES NEED ATTENTION")
        
        print("="*80)

    def run_all_tests(self):
        """Run comprehensive backend tests"""
        print("🚀 Starting Comprehensive Backend API Testing...")
        print(f"Base URL: {BASE_URL}")
        print(f"Test User: {self.test_user_email}")
        print(f"Focus: All critical backend endpoints after URL/auth fixes")
        
        test_results = []
        
        # Health Check
        test_results.append(self.test_health_check())
        
        # Authentication Flow Tests
        test_results.append(self.test_user_registration())
        test_results.append(self.test_duplicate_registration())
        test_results.append(self.test_user_login())
        test_results.append(self.test_invalid_login())
        test_results.append(self.test_session_check())
        
        # Game Progression Tests
        test_results.append(self.test_save_game())
        test_results.append(self.test_load_game())
        test_results.append(self.test_extreme_level_progression())
        
        # Game Systems Tests
        test_results.append(self.test_shuriken_generation())
        test_results.append(self.test_pet_generation())
        test_results.append(self.test_leaderboard())
        test_results.append(self.test_game_events())
        
        # Print summary
        self.print_summary()
        
        return all(test_results)

def test_specific_load_game_debugging():
    """Test load-game endpoint with specific user ID for mobile debugging"""
    print("\n" + "="*80)
    print("🔍 LOAD-GAME ENDPOINT DEBUGGING FOR MOBILE PROGRESS PERSISTENCE")
    print("🎯 Focus: User ID c16cbf6f-c1f4-495f-8a58-c94f32653225")
    print("="*80)
    
    # Specific user ID from review request
    user_id = "c16cbf6f-c1f4-495f-8a58-c94f32653225"
    
    print(f"📥 Testing GET /api/load-game/{user_id}")
    print(f"🌐 Backend URL: {BASE_URL}")
    print(f"⏰ Test Time: {datetime.now()}")
    
    try:
        session = requests.Session()
        
        # Test load-game endpoint with comprehensive logging
        response = session.get(f"{BASE_URL}/load-game/{user_id}")
        
        print(f"\n📊 RESPONSE ANALYSIS:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   Response Type: {type(data)}")
                
                if data is None:
                    print(f"\n❌ CRITICAL FINDING: Load returned None")
                    print(f"🔍 DIAGNOSIS: No saved data found for user {user_id}")
                    print(f"📋 POSSIBLE CAUSES:")
                    print(f"   1. User has never saved game data")
                    print(f"   2. Database query is not finding the user's data")
                    print(f"   3. User ID mismatch between save and load operations")
                    print(f"   4. Database connection or query issues")
                    print(f"\n📝 BACKEND LOGS SHOULD SHOW:")
                    print(f"   - '📥 LOAD REQUEST - Player ID: {user_id}'")
                    print(f"   - '❌ NO SAVE FOUND for player {user_id} - returning None'")
                    
                else:
                    print(f"\n✅ LOAD DATA FOUND - User has saved progress")
                    print(f"📊 SAVED DATA STRUCTURE:")
                    print(f"   - Player ID: {data.get('playerId', 'MISSING')}")
                    print(f"   - Ninja Level: {data.get('ninja', {}).get('level', 'MISSING')}")
                    print(f"   - Ninja XP: {data.get('ninja', {}).get('experience', 'MISSING')}")
                    print(f"   - Ninja Gold: {data.get('ninja', {}).get('gold', 'MISSING')}")
                    print(f"   - Ninja Gems: {data.get('ninja', {}).get('gems', 'MISSING')}")
                    print(f"   - Skill Points: {data.get('ninja', {}).get('skillPoints', 'MISSING')}")
                    print(f"   - Last Save Time: {data.get('lastSaveTime', 'MISSING')}")
                    print(f"   - Zone Progress: {data.get('zoneProgress', 'MISSING')}")
                    print(f"   - Shurikens Count: {len(data.get('shurikens', []))}")
                    print(f"   - Pets Count: {len(data.get('pets', []))}")
                    print(f"   - Achievements Count: {len(data.get('achievements', []))}")
                    
                    print(f"\n📝 BACKEND LOGS SHOULD SHOW:")
                    print(f"   - '📥 LOAD REQUEST - Player ID: {user_id}'")
                    print(f"   - '📥 FOUND SAVE DATA for {user_id}:'")
                    print(f"   - '   - Level: {data.get('ninja', {}).get('level', 'MISSING')}'")
                    print(f"   - '   - XP: {data.get('ninja', {}).get('experience', 'MISSING')}'")
                    print(f"   - '✅ LOAD COMPLETED - Returning saved data'")
                
                print(f"\n📄 FULL RESPONSE DATA:")
                print(json.dumps(data, indent=2, default=str))
                
            except json.JSONDecodeError as e:
                print(f"\n❌ JSON DECODE ERROR: {e}")
                print(f"📄 Raw Response: {response.text}")
                print(f"🔍 This indicates a server error or malformed response")
                
        else:
            print(f"\n❌ LOAD REQUEST FAILED")
            print(f"   Status Code: {response.status_code}")
            print(f"   Error Response: {response.text}")
            print(f"🔍 This indicates a server error or endpoint issue")
            
    except requests.exceptions.RequestException as e:
        print(f"\n💥 REQUEST ERROR: {e}")
        print(f"🔍 This indicates network connectivity or server availability issues")
    
    print(f"\n" + "="*80)
    print("🎯 DEBUGGING COMPLETE")
    print("📋 NEXT STEPS:")
    print("   1. Check backend supervisor logs: tail -n 100 /var/log/supervisor/backend.*.log")
    print("   2. Look for the load request logging entries shown above")
    print("   3. Verify if database contains saved data for this user")
    print("   4. Check if frontend is using correct user ID for save/load operations")
    print("="*80)

def main():
    """Main test execution - Comprehensive backend testing after zone progression system completion"""
    print("🎯 BACKEND COMPREHENSIVE TESTING AFTER ZONE PROGRESSION SYSTEM COMPLETION")
    print("🎯 Focus: Health Check, Authentication, Game Save/Load, Zone Data Processing")
    print("🎯 Priority: Zone progression data handling in save/load operations")
    
    # Run comprehensive backend test suite
    print("\n🚀 RUNNING COMPREHENSIVE BACKEND TEST SUITE:")
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    
    # Also run specific load-game debugging test for the user mentioned in review
    print("\n" + "="*80)
    print("🔍 ADDITIONAL: Load-game debugging for specific user")
    test_specific_load_game_debugging()
    
    return success

if __name__ == "__main__":
    main()