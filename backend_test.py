#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Ninja Master Mobile Game
Tests all API endpoints with realistic game data
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Get backend URL from environment
BACKEND_URL = "https://ninjaquest.preview.emergentagent.com/api"

class NinjaGameAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.test_player_id = f"ninja_master_{uuid.uuid4().hex[:8]}"
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_health_check(self):
        """Test GET /api/ - Basic health check"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Ninja Master Mobile API" in data["message"]:
                    self.log_test("Health Check", True, "API is responding correctly", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
        return False
    
    def test_save_game(self):
        """Test POST /api/save-game - Save player progress with high-level data"""
        try:
            # Create high-level ninja game data to test level-up system
            save_data = {
                "playerId": self.test_player_id,
                "ninja": {
                    "level": 87,  # High level for level-up system testing
                    "experience": 15750,  # High XP value (15000+)
                    "experienceToNext": 200,
                    "health": 450,
                    "maxHealth": 450,
                    "energy": 180,
                    "maxEnergy": 180,
                    "attack": 95,
                    "defense": 72,
                    "speed": 68,
                    "luck": 45,
                    "gold": 25000,
                    "gems": 850,
                    "skillPoints": 261  # 3 per level (87 * 3 = 261)
                },
                "shurikens": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Dragon Fang",
                        "rarity": "epic",
                        "attack": 35,
                        "level": 2,
                        "equipped": True
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Silver Star",
                        "rarity": "rare",
                        "attack": 20,
                        "level": 1,
                        "equipped": False
                    }
                ],
                "pets": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Epic Dragon",
                        "type": "Dragon",
                        "level": 3,
                        "experience": 150,
                        "happiness": 75,
                        "strength": 28,
                        "active": True,
                        "rarity": "epic"
                    }
                ],
                "achievements": ["first_kill", "level_5_reached", "epic_shuriken_found"],
                "unlockedFeatures": ["stats", "shurikens", "pets", "achievements"]
            }
            
            response = requests.post(
                f"{self.base_url}/save-game",
                json=save_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                # Verify all key fields are present
                required_fields = ["id", "playerId", "ninja", "shurikens", "pets", "lastSaveTime"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data["playerId"] == self.test_player_id:
                    self.log_test("Save Game", True, "Game saved successfully with all data", data)
                    self.saved_game_data = data  # Store for load test
                    return True
                else:
                    self.log_test("Save Game", False, f"Missing fields: {missing_fields} or playerId mismatch")
            else:
                self.log_test("Save Game", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Save Game", False, f"Error: {str(e)}")
        return False
    
    def test_load_game(self):
        """Test GET /api/load-game/{player_id} - Load saved game data"""
        try:
            response = requests.get(f"{self.base_url}/load-game/{self.test_player_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data and "playerId" in data:
                    # Verify loaded data matches saved data (high-level ninja)
                    if (data["playerId"] == self.test_player_id and 
                        data["ninja"]["level"] == 87 and  # Updated for high-level test
                        data["ninja"]["experience"] == 15750 and  # High XP value
                        data["ninja"]["skillPoints"] == 261 and  # 3 per level
                        len(data["shurikens"]) == 2 and
                        len(data["pets"]) == 1):
                        self.log_test("Load Game", True, "Game loaded successfully with correct data", data)
                        return True
                    else:
                        self.log_test("Load Game", False, "Loaded data doesn't match saved data")
                else:
                    self.log_test("Load Game", False, "No game data found or invalid format")
            else:
                self.log_test("Load Game", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Load Game", False, f"Error: {str(e)}")
        return False
    
    def test_load_nonexistent_game(self):
        """Test loading a non-existent player's game"""
        try:
            fake_player_id = f"nonexistent_{uuid.uuid4().hex[:8]}"
            response = requests.get(f"{self.base_url}/load-game/{fake_player_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data is None:
                    self.log_test("Load Nonexistent Game", True, "Correctly returned null for non-existent player")
                    return True
                else:
                    self.log_test("Load Nonexistent Game", False, f"Expected null, got: {data}")
            else:
                self.log_test("Load Nonexistent Game", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Load Nonexistent Game", False, f"Error: {str(e)}")
        return False
    
    def test_generate_shuriken(self):
        """Test POST /api/generate-shuriken - Generate random shurikens"""
        try:
            valid_rarities = ["common", "rare", "epic", "legendary"]
            generated_shurikens = []
            
            # Generate multiple shurikens to test variety
            for i in range(10):
                response = requests.post(f"{self.base_url}/generate-shuriken", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if "shuriken" in data:
                        shuriken = data["shuriken"]
                        generated_shurikens.append(shuriken)
                        
                        # Validate shuriken structure
                        required_fields = ["id", "name", "rarity", "attack", "level", "equipped"]
                        missing_fields = [field for field in required_fields if field not in shuriken]
                        
                        if missing_fields:
                            self.log_test("Generate Shuriken", False, f"Missing fields: {missing_fields}")
                            return False
                            
                        if shuriken["rarity"] not in valid_rarities:
                            self.log_test("Generate Shuriken", False, f"Invalid rarity: {shuriken['rarity']}")
                            return False
                            
                        if not (5 <= shuriken["attack"] <= 60):
                            self.log_test("Generate Shuriken", False, f"Attack stat out of range: {shuriken['attack']}")
                            return False
                    else:
                        self.log_test("Generate Shuriken", False, "No shuriken in response")
                        return False
                else:
                    self.log_test("Generate Shuriken", False, f"HTTP {response.status_code}: {response.text}")
                    return False
            
            # Check for variety in rarities
            rarities_found = set(s["rarity"] for s in generated_shurikens)
            self.log_test("Generate Shuriken", True, 
                         f"Generated {len(generated_shurikens)} shurikens with rarities: {list(rarities_found)}")
            return True
            
        except Exception as e:
            self.log_test("Generate Shuriken", False, f"Error: {str(e)}")
        return False
    
    def test_generate_pet(self):
        """Test POST /api/generate-pet - Generate random pets"""
        try:
            valid_rarities = ["common", "rare", "epic", "legendary"]
            valid_types = ["Dragon", "Wolf", "Eagle", "Tiger", "Phoenix", "Shadow Cat", "Spirit Fox"]
            generated_pets = []
            
            # Generate multiple pets to test variety
            for i in range(10):
                response = requests.post(f"{self.base_url}/generate-pet", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if "pet" in data:
                        pet = data["pet"]
                        generated_pets.append(pet)
                        
                        # Validate pet structure
                        required_fields = ["id", "name", "type", "level", "experience", "happiness", "strength", "active", "rarity"]
                        missing_fields = [field for field in required_fields if field not in pet]
                        
                        if missing_fields:
                            self.log_test("Generate Pet", False, f"Missing fields: {missing_fields}")
                            return False
                            
                        if pet["rarity"] not in valid_rarities:
                            self.log_test("Generate Pet", False, f"Invalid rarity: {pet['rarity']}")
                            return False
                            
                        if pet["type"] not in valid_types:
                            self.log_test("Generate Pet", False, f"Invalid pet type: {pet['type']}")
                            return False
                            
                        if not (8 <= pet["strength"] <= 50):
                            self.log_test("Generate Pet", False, f"Strength stat out of range: {pet['strength']}")
                            return False
                    else:
                        self.log_test("Generate Pet", False, "No pet in response")
                        return False
                else:
                    self.log_test("Generate Pet", False, f"HTTP {response.status_code}: {response.text}")
                    return False
            
            # Check for variety
            types_found = set(p["type"] for p in generated_pets)
            rarities_found = set(p["rarity"] for p in generated_pets)
            self.log_test("Generate Pet", True, 
                         f"Generated {len(generated_pets)} pets with types: {list(types_found)}, rarities: {list(rarities_found)}")
            return True
            
        except Exception as e:
            self.log_test("Generate Pet", False, f"Error: {str(e)}")
        return False
    
    def test_leaderboard(self):
        """Test GET /api/leaderboard - Get top players"""
        try:
            # First create multiple test players for leaderboard
            test_players = []
            for i in range(3):
                player_id = f"leaderboard_test_{i}_{uuid.uuid4().hex[:6]}"
                test_players.append(player_id)
                
                save_data = {
                    "playerId": player_id,
                    "ninja": {
                        "level": 10 - i,  # Different levels for sorting
                        "experience": (10 - i) * 100,
                        "experienceToNext": 100,
                        "health": 100,
                        "maxHealth": 100,
                        "energy": 50,
                        "maxEnergy": 50,
                        "attack": 10,
                        "defense": 5,
                        "speed": 8,
                        "luck": 3,
                        "gold": (10 - i) * 200,
                        "gems": 10,
                        "skillPoints": 0
                    },
                    "shurikens": [],
                    "pets": [],
                    "achievements": [],
                    "unlockedFeatures": ["stats"]
                }
                
                # Save each test player
                requests.post(f"{self.base_url}/save-game", json=save_data, timeout=10)
            
            # Wait a moment for saves to complete
            time.sleep(1)
            
            # Now test leaderboard
            response = requests.get(f"{self.base_url}/leaderboard", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "leaderboard" in data and isinstance(data["leaderboard"], list):
                    leaderboard = data["leaderboard"]
                    
                    # Check if leaderboard has entries
                    if len(leaderboard) > 0:
                        # Verify sorting (highest level first)
                        is_sorted = True
                        for i in range(len(leaderboard) - 1):
                            if leaderboard[i]["level"] < leaderboard[i + 1]["level"]:
                                is_sorted = False
                                break
                        
                        if is_sorted:
                            self.log_test("Leaderboard", True, 
                                         f"Leaderboard returned {len(leaderboard)} entries, properly sorted")
                            return True
                        else:
                            self.log_test("Leaderboard", False, "Leaderboard not properly sorted by level")
                    else:
                        self.log_test("Leaderboard", False, "Leaderboard is empty")
                else:
                    self.log_test("Leaderboard", False, "Invalid leaderboard response format")
            else:
                self.log_test("Leaderboard", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Leaderboard", False, f"Error: {str(e)}")
        return False
    
    def test_game_events(self):
        """Test GET /api/game-events - Get current game events"""
        try:
            response = requests.get(f"{self.base_url}/game-events", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "events" in data and isinstance(data["events"], list):
                    events = data["events"]
                    
                    # Validate event structure
                    for event in events:
                        required_fields = ["id", "title", "description", "type", "active"]
                        missing_fields = [field for field in required_fields if field not in event]
                        
                        if missing_fields:
                            self.log_test("Game Events", False, f"Event missing fields: {missing_fields}")
                            return False
                    
                    self.log_test("Game Events", True, f"Retrieved {len(events)} game events successfully")
                    return True
                else:
                    self.log_test("Game Events", False, "Invalid events response format")
            else:
                self.log_test("Game Events", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Game Events", False, f"Error: {str(e)}")
        return False
    
    def test_extreme_level_progression(self):
        """Test extreme level progression (15000+ XP, high levels)"""
        try:
            extreme_player_id = f"extreme_ninja_{uuid.uuid4().hex[:8]}"
            
            extreme_data = {
                "playerId": extreme_player_id,
                "ninja": {
                    "level": 999,  # Extreme level
                    "experience": 999999,  # Extreme XP (way above 15000+)
                    "experienceToNext": 1000,
                    "health": 9999,
                    "maxHealth": 9999,
                    "energy": 999,
                    "maxEnergy": 999,
                    "attack": 999,
                    "defense": 999,
                    "speed": 999,
                    "luck": 999,
                    "gold": 999999,
                    "gems": 99999,
                    "skillPoints": 2997  # 999 * 3 = 2997 skill points
                },
                "shurikens": [],
                "pets": [],
                "achievements": [],
                "unlockedFeatures": ["stats", "shurikens", "pets"]
            }
            
            # Test save
            response = requests.post(
                f"{self.base_url}/save-game",
                json=extreme_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                save_data = response.json()
                
                # Test load to verify persistence
                load_response = requests.get(f"{self.base_url}/load-game/{extreme_player_id}", timeout=10)
                
                if load_response.status_code == 200:
                    load_data = load_response.json()
                    if (load_data and 
                        load_data['ninja']['level'] == 999 and
                        load_data['ninja']['experience'] == 999999 and
                        load_data['ninja']['skillPoints'] == 2997):
                        self.log_test("Extreme Level Progression", True, 
                                     "Successfully handled extreme level values (999 level, 999999 XP, 2997 skill points)")
                        return True
                    else:
                        self.log_test("Extreme Level Progression", False, 
                                     "Extreme level data not persisted correctly")
                else:
                    self.log_test("Extreme Level Progression", False, 
                                 f"Failed to load extreme level data: {load_response.status_code}")
            else:
                self.log_test("Extreme Level Progression", False, 
                             f"Failed to save extreme level data: {response.status_code}")
                
        except Exception as e:
            self.log_test("Extreme Level Progression", False, f"Error: {str(e)}")
        return False

    def test_malformed_save_data(self):
        """Test error handling with malformed save data"""
        try:
            # Test with missing required fields
            malformed_data = {
                "playerId": "test_malformed",
                # Missing ninja field
                "shurikens": [],
                "pets": []
            }
            
            response = requests.post(
                f"{self.base_url}/save-game",
                json=malformed_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 422:  # Validation error expected
                self.log_test("Malformed Save Data", True, "Correctly rejected malformed data with 422 error")
                return True
            else:
                self.log_test("Malformed Save Data", False, 
                             f"Expected 422 validation error, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Malformed Save Data", False, f"Error: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Ninja Master Mobile Game API Tests")
        print(f"🎯 Testing against: {self.base_url}")
        print("=" * 60)
        
        tests = [
            self.test_health_check,
            self.test_save_game,
            self.test_load_game,
            self.test_load_nonexistent_game,
            self.test_extreme_level_progression,  # Added extreme level test
            self.test_generate_shuriken,
            self.test_generate_pet,
            self.test_leaderboard,
            self.test_game_events,
            self.test_malformed_save_data
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {str(e)}")
        
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! API is working correctly.")
        else:
            print(f"⚠️  {total - passed} tests failed. Check the details above.")
        
        return passed == total

if __name__ == "__main__":
    tester = NinjaGameAPITester()
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\n" + "=" * 60)
    print("📋 DETAILED TEST RESULTS:")
    print("=" * 60)
    
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['message']}")
    
    exit(0 if success else 1)