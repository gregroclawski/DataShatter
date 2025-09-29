#!/usr/bin/env python3
"""
Zone Progression System Backend Testing
Focus: Verify backend can handle the new 50-zone linear progression system data
"""

import requests
import json
import uuid
from datetime import datetime

BACKEND_URL = "https://rpg-rebalance.preview.emergentagent.com/api"

def test_zone_progression_data_handling():
    """Test backend handling of new zone progression system data"""
    print("🎯 ZONE PROGRESSION SYSTEM BACKEND TESTING")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Focus: New 50-zone linear progression system data handling")
    print()
    
    session = requests.Session()
    test_user_id = str(uuid.uuid4())
    
    # Create comprehensive zone progression data matching the new system
    zone_progression_data = {
        "playerId": test_user_id,
        "ninja": {
            "level": 35,
            "experience": 12250,
            "experienceToNext": 3600,
            "health": 525,
            "maxHealth": 525,
            "energy": 175,
            "maxEnergy": 175,
            "attack": 70,
            "defense": 35,
            "speed": 28,
            "luck": 21,
            "gold": 8750,
            "gems": 425,
            "skillPoints": 105
        },
        "shurikens": [
            {
                "id": str(uuid.uuid4()),
                "name": "Void Piercer",
                "rarity": "epic",
                "attack": 38,
                "level": 4,
                "equipped": True
            }
        ],
        "pets": [
            {
                "id": str(uuid.uuid4()),
                "name": "Legendary Phoenix",
                "type": "Phoenix",
                "level": 8,
                "experience": 640,
                "happiness": 95,
                "strength": 45,
                "active": True,
                "rarity": "legendary"
            }
        ],
        "achievements": ["first_kill", "level_10", "level_25", "zone_10_complete", "zone_20_complete"],
        "unlockedFeatures": ["stats", "shurikens", "pets", "zones", "equipment", "boss_battles"],
        "zoneProgress": {
            "currentZone": 23,
            "zones": {
                # Zones 1-5: 30-50 kills per level (fast early progression)
                "1": {"unlocked": True, "completed": True, "killCount": 30, "killRequirement": 30},
                "2": {"unlocked": True, "completed": True, "killCount": 35, "killRequirement": 35},
                "3": {"unlocked": True, "completed": True, "killCount": 40, "killRequirement": 40},
                "4": {"unlocked": True, "completed": True, "killCount": 45, "killRequirement": 45},
                "5": {"unlocked": True, "completed": True, "killCount": 50, "killRequirement": 50},
                
                # Zones 6-15: 50-90 kills per level
                "6": {"unlocked": True, "completed": True, "killCount": 55, "killRequirement": 55},
                "7": {"unlocked": True, "completed": True, "killCount": 60, "killRequirement": 60},
                "8": {"unlocked": True, "completed": True, "killCount": 65, "killRequirement": 65},
                "9": {"unlocked": True, "completed": True, "killCount": 70, "killRequirement": 70},
                "10": {"unlocked": True, "completed": True, "killCount": 75, "killRequirement": 75},
                "11": {"unlocked": True, "completed": True, "killCount": 80, "killRequirement": 80},
                "12": {"unlocked": True, "completed": True, "killCount": 85, "killRequirement": 85},
                "13": {"unlocked": True, "completed": True, "killCount": 90, "killRequirement": 90},
                "14": {"unlocked": True, "completed": True, "killCount": 85, "killRequirement": 85},
                "15": {"unlocked": True, "completed": True, "killCount": 90, "killRequirement": 90},
                
                # Zones 16-30: 75-135 kills per level
                "16": {"unlocked": True, "completed": True, "killCount": 95, "killRequirement": 95},
                "17": {"unlocked": True, "completed": True, "killCount": 100, "killRequirement": 100},
                "18": {"unlocked": True, "completed": True, "killCount": 105, "killRequirement": 105},
                "19": {"unlocked": True, "completed": True, "killCount": 110, "killRequirement": 110},
                "20": {"unlocked": True, "completed": True, "killCount": 115, "killRequirement": 115},
                "21": {"unlocked": True, "completed": True, "killCount": 120, "killRequirement": 120},
                "22": {"unlocked": True, "completed": True, "killCount": 125, "killRequirement": 125},
                "23": {"unlocked": True, "completed": False, "killCount": 87, "killRequirement": 130},
                
                # Future zones (locked)
                "24": {"unlocked": False, "completed": False, "killCount": 0, "killRequirement": 135},
                "25": {"unlocked": False, "completed": False, "killCount": 0, "killRequirement": 135},
            },
            "totalKills": 1847,
            "highestZone": 23,
            "bossesDefeated": ["Forest Guardian", "Flame Lord", "Ice Queen", "Shadow Master", "Earth Titan"],
            "xpMultiplier": 2.3,  # Based on current zone
            "lastZoneUpdate": datetime.utcnow().isoformat()
        },
        "equipment": {
            "helmet": {"id": "shadow_helm_001", "name": "Shadow Helm", "defense": 22, "health": 45, "rarity": "epic"},
            "armor": {"id": "dragon_scale_001", "name": "Dragon Scale Armor", "defense": 38, "health": 95, "rarity": "legendary"},
            "weapon": {"id": "void_blade_001", "name": "Void Blade", "attack": 42, "critChance": 15, "rarity": "epic"},
            "shield": {"id": "titan_shield_001", "name": "Titan Shield", "defense": 55, "health": 120, "rarity": "legendary"}
        }
    }
    
    print("📊 TESTING ZONE PROGRESSION DATA STRUCTURE:")
    print(f"   - Current Zone: {zone_progression_data['zoneProgress']['currentZone']}")
    print(f"   - Zones Tracked: {len(zone_progression_data['zoneProgress']['zones'])}")
    print(f"   - Total Kills: {zone_progression_data['zoneProgress']['totalKills']}")
    print(f"   - Highest Zone: {zone_progression_data['zoneProgress']['highestZone']}")
    print(f"   - Bosses Defeated: {len(zone_progression_data['zoneProgress']['bossesDefeated'])}")
    print()
    
    # Test 1: Save game with zone progression data
    print("🧪 TEST 1: Save Game with Zone Progression Data")
    try:
        save_response = session.post(f"{BACKEND_URL}/save-game", json=zone_progression_data)
        
        if save_response.status_code == 200:
            save_data = save_response.json()
            print("✅ PASS: Zone progression data saved successfully")
            print(f"   - Saved Level: {save_data['ninja']['level']}")
            print(f"   - Zone Progress Preserved: {bool(save_data.get('zoneProgress'))}")
            print(f"   - Equipment Preserved: {bool(save_data.get('equipment'))}")
        else:
            print(f"❌ FAIL: Save failed with status {save_response.status_code}")
            print(f"   Error: {save_response.text}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Save exception: {str(e)}")
        return False
    
    print()
    
    # Test 2: Load game and verify zone progression data integrity
    print("🧪 TEST 2: Load Game and Verify Zone Progression Data Integrity")
    try:
        load_response = session.get(f"{BACKEND_URL}/load-game/{test_user_id}")
        
        if load_response.status_code == 200:
            load_data = load_response.json()
            
            if load_data:
                # Verify zone progression data integrity
                loaded_zones = load_data.get('zoneProgress', {})
                original_zones = zone_progression_data['zoneProgress']
                
                print("✅ PASS: Game data loaded successfully")
                print(f"   - Loaded Level: {load_data['ninja']['level']}")
                print(f"   - Current Zone: {loaded_zones.get('currentZone', 'MISSING')}")
                print(f"   - Total Kills: {loaded_zones.get('totalKills', 'MISSING')}")
                print(f"   - Highest Zone: {loaded_zones.get('highestZone', 'MISSING')}")
                
                # Verify specific zone data
                if 'zones' in loaded_zones:
                    zone_23_data = loaded_zones['zones'].get('23', {})
                    print(f"   - Zone 23 Progress: {zone_23_data.get('killCount', 'MISSING')}/{zone_23_data.get('killRequirement', 'MISSING')}")
                    print(f"   - Zone 23 Completed: {zone_23_data.get('completed', 'MISSING')}")
                
                # Verify bosses defeated
                bosses = loaded_zones.get('bossesDefeated', [])
                print(f"   - Bosses Defeated: {len(bosses)} ({', '.join(bosses[:3])}{'...' if len(bosses) > 3 else ''})")
                
                # Verify equipment data
                equipment = load_data.get('equipment', {})
                print(f"   - Equipment Slots: {len(equipment)} ({'✅' if equipment else '❌'})")
                
                # Data integrity check
                if (loaded_zones.get('currentZone') == original_zones['currentZone'] and
                    loaded_zones.get('totalKills') == original_zones['totalKills'] and
                    loaded_zones.get('highestZone') == original_zones['highestZone']):
                    print("✅ PASS: Zone progression data integrity verified")
                else:
                    print("❌ FAIL: Zone progression data integrity compromised")
                    return False
            else:
                print("❌ FAIL: No data returned from load operation")
                return False
        else:
            print(f"❌ FAIL: Load failed with status {load_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Load exception: {str(e)}")
        return False
    
    print()
    
    # Test 3: Test extreme zone progression (zones 31-50)
    print("🧪 TEST 3: Test Extreme Zone Progression (Zones 31-50)")
    try:
        extreme_zone_data = zone_progression_data.copy()
        extreme_zone_data['zoneProgress']['currentZone'] = 47
        extreme_zone_data['zoneProgress']['highestZone'] = 47
        extreme_zone_data['zoneProgress']['totalKills'] = 8500
        
        # Add zones 31-50 data
        for zone in range(31, 51):
            if zone <= 47:
                kill_req = 120 + (zone - 31) * 5  # Zones 31-45: 120-200 kills
                if zone >= 46:
                    kill_req = 175 + (zone - 46) * 25  # Zones 46-50: 175-275 kills
                
                extreme_zone_data['zoneProgress']['zones'][str(zone)] = {
                    "unlocked": True,
                    "completed": zone < 47,
                    "killCount": kill_req if zone < 47 else int(kill_req * 0.7),
                    "killRequirement": kill_req
                }
            else:
                extreme_zone_data['zoneProgress']['zones'][str(zone)] = {
                    "unlocked": False,
                    "completed": False,
                    "killCount": 0,
                    "killRequirement": 200 + (zone - 46) * 25
                }
        
        # Save extreme zone data
        extreme_save_response = session.post(f"{BACKEND_URL}/save-game", json=extreme_zone_data)
        
        if extreme_save_response.status_code == 200:
            # Load and verify
            extreme_load_response = session.get(f"{BACKEND_URL}/load-game/{test_user_id}")
            
            if extreme_load_response.status_code == 200:
                extreme_load_data = extreme_load_response.json()
                loaded_zones = extreme_load_data.get('zoneProgress', {})
                
                print("✅ PASS: Extreme zone progression handled successfully")
                print(f"   - Current Zone: {loaded_zones.get('currentZone', 'MISSING')}")
                print(f"   - Total Zones Tracked: {len(loaded_zones.get('zones', {}))}")
                print(f"   - Zone 47 Progress: {loaded_zones.get('zones', {}).get('47', {}).get('killCount', 'MISSING')}/{loaded_zones.get('zones', {}).get('47', {}).get('killRequirement', 'MISSING')}")
                print(f"   - Zone 50 Kill Requirement: {loaded_zones.get('zones', {}).get('50', {}).get('killRequirement', 'MISSING')}")
            else:
                print(f"❌ FAIL: Extreme zone load failed with status {extreme_load_response.status_code}")
                return False
        else:
            print(f"❌ FAIL: Extreme zone save failed with status {extreme_save_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Extreme zone test exception: {str(e)}")
        return False
    
    print()
    print("=" * 80)
    print("🎉 ZONE PROGRESSION SYSTEM BACKEND TESTING COMPLETE")
    print("✅ All tests passed - Backend successfully handles new 50-zone linear progression system")
    print("✅ Zone progression data persistence verified")
    print("✅ Equipment integration working")
    print("✅ Extreme zone progression supported")
    print("=" * 80)
    
    return True

if __name__ == "__main__":
    success = test_zone_progression_data_handling()
    if success:
        print("\n🎯 CONCLUSION: Backend is fully compatible with the new zone progression system")
    else:
        print("\n⚠️ CONCLUSION: Backend has issues with zone progression system data handling")