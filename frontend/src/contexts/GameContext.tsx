import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';

export interface NinjaStats {
  level: number;
  experience: number;
  experienceToNext: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  gold: number;
  gems: number;
  skillPoints: number;
}

export interface Shuriken {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attack: number;
  level: number;
  equipped: boolean;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  level: number;
  experience: number;
  happiness: number;
  strength: number;
  active: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Raid {
  id: string;
  name: string;
  boss: string;
  difficulty: number;
  rewards: {
    gold: number;
    experience: number;
    items?: string[];
  };
  unlocked: boolean;
  completed: boolean;
}

export interface Adventure {
  id: string;
  name: string;
  location: string;
  duration: number; // in minutes
  requirements: {
    level?: number;
    items?: string[];
  };
  rewards: {
    gold: number;
    experience: number;
    items?: string[];
  };
  active: boolean;
  startTime?: number;
}

export interface GameState {
  ninja: NinjaStats;
  shurikens: Shuriken[];
  pets: Pet[];
  raids: Raid[];
  adventures: Adventure[];
  currentAdventure?: Adventure;
  lastSaveTime: number;
  isAlive: boolean;
  achievements: string[];
  unlockedFeatures: string[];
  zoneProgress?: Record<number, any>; // Zone progression data
}

interface GameContextType {
  gameState: GameState;
  isLoading: boolean;
  updateNinja: (updates: Partial<NinjaStats>) => void;
  addShuriken: (shuriken: Shuriken) => void;
  equipShuriken: (id: string) => void;
  upgradeShuriken: (id: string) => void;
  addPet: (pet: Pet) => void;
  setActivePet: (id: string) => void;
  feedPet: (id: string) => void;
  trainPet: (id: string) => void;
  startRaid: (id: string) => void;
  startAdventure: (id: string) => void;
  completeAdventure: () => void;
  reviveNinja: () => void;
  trainSkill: (skill: string) => void;
  collectIdleRewards: () => void;
  saveGame: () => void;
  loadGame: () => void;
  updateZoneProgress: (zoneProgress: Record<number, any>) => void;
  saveOnEvent: (eventType: string) => void;
}

const defaultGameState: GameState = {
  ninja: {
    level: 1,
    experience: 0,
    experienceToNext: 100,
    health: 100,
    maxHealth: 100,
    energy: 50,
    maxEnergy: 50,
    attack: 10,
    defense: 5,
    speed: 8,
    luck: 3,
    gold: 100,
    gems: 10,
    skillPoints: 3, // Start with 3 skill points
  },
  shurikens: [
    {
      id: '1',
      name: 'Training Shuriken',
      rarity: 'common',
      attack: 5,
      level: 1,
      equipped: true,
    },
  ],
  pets: [],
  raids: [
    {
      id: '1',
      name: 'Forest Guardian',
      boss: 'Shadow Wolf',
      difficulty: 1,
      rewards: { gold: 50, experience: 25 },
      unlocked: true,
      completed: false,
    },
  ],
  adventures: [
    {
      id: '1',
      name: 'Herb Gathering',
      location: 'Mystic Forest',
      duration: 5,
      requirements: { level: 1 },
      rewards: { gold: 20, experience: 20 },
      active: false,
    },
  ],
  lastSaveTime: Date.now(),
  isAlive: true,
  achievements: [],
  unlockedFeatures: ['stats', 'shurikens'],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [isLoading, setIsLoading] = useState(true);
  const lastSaveTimeRef = useRef<number>(Date.now());

  const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // Load game data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      loadGameFromServer();
    }
    // Don't reset game state when not authenticated - keep current state
  }, [isAuthenticated, user]);

  // Auto-save when authenticated - Very frequent saves
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      saveGameToServer();
      collectIdleRewards();
    }, 5000); // Changed to 5 seconds for very frequent saves

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Event-driven saves - Save on important game events
  const saveOnEvent = useCallback((eventType: string) => {
    if (isAuthenticated) {
      console.log(`💾 Event-driven save triggered: ${eventType}`);
      saveGameToServer();
    }
  }, [isAuthenticated]);

  // Critical milestone save - Save immediately on very important events
  const saveOnMilestone = useCallback((milestoneType: string) => {
    if (isAuthenticated) {
      console.log(`🏆 MILESTONE SAVE triggered: ${milestoneType}`);
      // Save immediately without delay for critical milestones
      saveGameToServer();
    }
  }, [isAuthenticated]);

  // Calculate experience required for next level (incremental up to level 15000)
  const calculateExpForLevel = (level: number): number => {
    if (level <= 1) return 100;
    if (level >= 15000) return 1000000; // Max exp requirement at level 15000
    
    // Exponential scaling up to level 15000
    // Base formula: 100 * (1.05^(level-1))
    const baseExp = 100;
    const growthRate = 1.05;
    const expRequired = Math.floor(baseExp * Math.pow(growthRate, level - 1));
    
    // Cap at reasonable maximum
    return Math.min(expRequired, 1000000);
  };

  // Handle level up logic with proper exp scaling and 3 stat points per level
  const handleLevelUp = (ninja: NinjaStats): Partial<NinjaStats> => {
    console.log(`🔍 Level check: ${ninja.experience}/${ninja.experienceToNext} XP at level ${ninja.level}`);
    
    let updates: Partial<NinjaStats> = {};
    let currentLevel = ninja.level;
    let currentExp = ninja.experience;
    let currentExpToNext = ninja.experienceToNext;
    
    // Check for multiple level ups
    while (currentExp >= currentExpToNext && currentLevel < 15000) {
      currentLevel += 1;
      currentExp -= currentExpToNext;
      currentExpToNext = calculateExpForLevel(currentLevel + 1); // Calculate exp for NEXT level
      
      // Add stat bonuses for each level
      updates = {
        ...updates,
        level: currentLevel,
        experience: currentExp,
        experienceToNext: currentExpToNext,
        maxHealth: (updates.maxHealth || ninja.maxHealth) + 15, // +15 HP per level
        maxEnergy: (updates.maxEnergy || ninja.maxEnergy) + 5, // +5 Energy per level
        skillPoints: (updates.skillPoints || ninja.skillPoints) + 3, // +3 Skill Points per level
        attack: (updates.attack || ninja.attack) + 2, // +2 Attack per level
        defense: (updates.defense || ninja.defense) + 1, // +1 Defense per level
      };
    }

    if (updates.level) {
      // Heal to full when leveling up
      updates.health = updates.maxHealth;
      updates.energy = updates.maxEnergy;
      updates.experience = currentExp;
      updates.experienceToNext = currentExpToNext;
    }

    return updates;
  };

  const saveGameToServer = async () => {
    if (!isAuthenticated || !user?.id) {
      console.warn('Cannot save game: user not authenticated');
      return;
    }

    try {
      const now = Date.now();
      const saveData = {
        playerId: user.id,
        ninja: gameState.ninja,
        shurikens: gameState.shurikens,
        pets: gameState.pets,
        achievements: gameState.achievements,
        unlockedFeatures: gameState.unlockedFeatures,
        zoneProgress: gameState.zoneProgress || { 1: { zoneId: 1, currentLevel: 1, killsInLevel: 0, completed: false } },
      };

      console.log('💾 Saving game to server for user:', user.id, 'Level:', gameState.ninja.level, 'XP:', gameState.ninja.experience, 'Zone Progress:', gameState.zoneProgress);

      const response = await fetch(`${API_BASE_URL}/api/save-game`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const result = await response.json();
      lastSaveTimeRef.current = now;
      console.log('✅ Game saved to server successfully - Level:', result.ninja?.level, 'Zone Progress:', result.zoneProgress);
    } catch (error) {
      console.error('❌ Failed to save game to server:', error);
      
      // Fallback to local storage
      try {
        const saveData = {
          ...gameState,
          lastSaveTime: Date.now(),
        };
        await AsyncStorage.setItem(`ninjaGameSave_${user.id}`, JSON.stringify(saveData));
        console.log('💾 Game saved locally as fallback');
      } catch (localError) {
        console.error('Failed to save locally:', localError);
      }
    }
  };

  const loadGameFromServer = async () => {
    if (!isAuthenticated || !user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const startTime = Date.now(); // Track loading start time
      console.log('🔄 Loading game data for user:', user.id);
      
      const response = await fetch(`${API_BASE_URL}/api/load-game/${user.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Load failed: ${response.status}`);
      }

      const savedData = await response.json();
      console.log('📥 Server response:', savedData ? 'Data found' : 'No data');
      
      if (savedData && savedData.ninja) {
        // Server returned valid game data
        const loadedGameState: GameState = {
          ninja: savedData.ninja,
          shurikens: savedData.shurikens || [],
          pets: savedData.pets || [],
          raids: defaultGameState.raids, // Keep default raids for now
          adventures: defaultGameState.adventures, // Keep default adventures for now
          lastSaveTime: new Date(savedData.lastSaveTime).getTime(),
          isAlive: savedData.isAlive !== false,
          achievements: savedData.achievements || [],
          unlockedFeatures: savedData.unlockedFeatures || ['stats', 'shurikens'],
          zoneProgress: savedData.zoneProgress || { 1: { zoneId: 1, currentLevel: 1, killsInLevel: 0, completed: false } },
        };
        
        lastSaveTimeRef.current = loadedGameState.lastSaveTime;
        setGameState(loadedGameState);
        console.log('✅ Game loaded from server - Level:', loadedGameState.ninja.level, 'XP:', loadedGameState.ninja.experience);
      } else {
        // No server data, check for local backup then use defaults
        console.log('🆕 No server data found, checking local backup...');
        await loadLocalGameBackup();
      }

      // Ensure minimum 5 second loading time for user experience
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 5000; // 5 seconds
      if (elapsedTime < minLoadingTime) {
        const remainingTime = minLoadingTime - elapsedTime;
        console.log(`⏱️ Extending loading screen for ${remainingTime}ms to show themed animation`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } catch (error) {
      console.error('❌ Failed to load game from server:', error);
      // Show user-friendly error but don't crash
      console.log('💾 Attempting to load from local backup...');
      await loadLocalGameBackup();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalGameBackup = async () => {
    if (!user?.id) return;
    
    try {
      const savedData = await AsyncStorage.getItem(`ninjaGameSave_${user.id}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        lastSaveTimeRef.current = parsedData.lastSaveTime || Date.now();
        setGameState(parsedData);
        console.log('💾 Game loaded from local backup');
        
        // Try to save this data to server
        setTimeout(() => saveGameToServer(), 1000);
      } else {
        // No local data either, start with fresh game
        console.log('🆕 Starting fresh game for user');
        setGameState(defaultGameState);
      }
    } catch (error) {
      console.error('Failed to load local backup:', error);
      setGameState(defaultGameState);
    }
  };

  const updateZoneProgress = (zoneProgress: Record<number, any>) => {
    setGameState(prev => ({
      ...prev,
      zoneProgress
    }));
    
    // Auto-save when zone progress updates
    if (isAuthenticated) {
      setTimeout(() => saveGameToServer(), 500);
    }
  };

  const updateNinja = (updates: Partial<NinjaStats> | ((prev: NinjaStats) => Partial<NinjaStats>)) => {
    setGameState(prev => {
      // Handle both object updates and function updates
      const actualUpdates = typeof updates === 'function' 
        ? updates(prev.ninja)
        : updates;
        
      const updatedNinja = { ...prev.ninja, ...actualUpdates };
      
      // Check for level up with new system
      const levelUpUpdates = handleLevelUp(updatedNinja);
      const finalNinja = { ...updatedNinja, ...levelUpUpdates };
      
      const newGameState = {
        ...prev,
        ninja: finalNinja
      };
      
      // AGGRESSIVE Event-driven saves - Save immediately on ANY important event
      if (isAuthenticated) {
        // CRITICAL MILESTONE: Level up - Save immediately
        if (finalNinja.level > prev.ninja.level) {
          console.log('🏆 CRITICAL MILESTONE: Level up - IMMEDIATE SAVE');
          saveOnMilestone('level_up');
        }
        // MILESTONE: Every 10 XP gained - Frequent saves during combat
        else if (finalNinja.experience >= prev.ninja.experience + 10) {
          console.log('💾 MILESTONE: 10+ XP gained - SAVE');
          saveOnEvent('xp_milestone');
        }
        // MILESTONE: Any currency change - Save all transactions
        else if (finalNinja.gold !== prev.ninja.gold || finalNinja.gems !== prev.ninja.gems) {
          console.log('💰 MILESTONE: Currency change - SAVE');
          saveOnMilestone('currency_change');
        }
        // MILESTONE: Skill point spending - Save character development
        else if (finalNinja.skillPoints < prev.ninja.skillPoints) {
          console.log('📈 MILESTONE: Skill points spent - SAVE');
          saveOnMilestone('skill_upgrade');
        }
        // MILESTONE: Health/stats changes - Save character upgrades
        else if (finalNinja.maxHealth !== prev.ninja.maxHealth || finalNinja.attack !== prev.ninja.attack) {
          console.log('⚡ MILESTONE: Stats upgraded - SAVE');
          saveOnMilestone('stat_upgrade');
        }
        // Regular save for any other changes
        else {
          saveOnEvent('general_update');
        }
      }
      
      return newGameState;
    });
  };

  const addShuriken = (shuriken: Shuriken) => {
    setGameState(prev => ({
      ...prev,
      shurikens: [...prev.shurikens, shuriken]
    }));
  };

  const equipShuriken = (id: string) => {
    setGameState(prev => ({
      ...prev,
      shurikens: prev.shurikens.map(shuriken => ({
        ...shuriken,
        equipped: shuriken.id === id
      }))
    }));
  };

  const upgradeShuriken = (id: string) => {
    setGameState(prev => ({
      ...prev,
      shurikens: prev.shurikens.map(shuriken =>
        shuriken.id === id
          ? { 
              ...shuriken, 
              level: shuriken.level + 1,
              attack: shuriken.attack + Math.floor(shuriken.attack * 0.2)
            }
          : shuriken
      ),
      ninja: {
        ...prev.ninja,
        gold: prev.ninja.gold - (50 * prev.shurikens.find(s => s.id === id)?.level || 1)
      }
    }));
  };

  const addPet = (pet: Pet) => {
    setGameState(prev => ({
      ...prev,
      pets: [...prev.pets, pet]
    }));
  };

  const setActivePet = (id: string) => {
    setGameState(prev => ({
      ...prev,
      pets: prev.pets.map(pet => ({
        ...pet,
        active: pet.id === id
      }))
    }));
  };

  const feedPet = (id: string) => {
    setGameState(prev => ({
      ...prev,
      pets: prev.pets.map(pet =>
        pet.id === id
          ? { ...pet, happiness: Math.min(100, pet.happiness + 10) }
          : pet
      ),
      ninja: { ...prev.ninja, gold: prev.ninja.gold - 10 }
    }));
  };

  const trainPet = (id: string) => {
    setGameState(prev => ({
      ...prev,
      pets: prev.pets.map(pet =>
        pet.id === id
          ? { 
              ...pet, 
              experience: pet.experience + 20,
              level: pet.experience >= pet.level * 100 ? pet.level + 1 : pet.level,
              strength: pet.experience >= pet.level * 100 ? pet.strength + 5 : pet.strength
            }
          : pet
      ),
      ninja: { ...prev.ninja, gold: prev.ninja.gold - 25 }
    }));
  };

  const startRaid = (id: string) => {
    const raid = gameState.raids.find(r => r.id === id);
    if (raid && gameState.ninja.energy >= 10) {
      const success = Math.random() > 0.3; // 70% success rate
      if (success) {
        updateNinja({
          gold: gameState.ninja.gold + raid.rewards.gold,
          experience: gameState.ninja.experience + raid.rewards.experience,
          energy: gameState.ninja.energy - 10
        });
        setGameState(prev => ({
          ...prev,
          raids: prev.raids.map(r =>
            r.id === id ? { ...r, completed: true } : r
          )
        }));
      } else {
        updateNinja({
          health: Math.max(1, gameState.ninja.health - 20),
          energy: gameState.ninja.energy - 10
        });
      }
    }
  };

  const startAdventure = (id: string) => {
    const adventure = gameState.adventures.find(a => a.id === id);
    if (adventure && gameState.ninja.energy >= 5) {
      setGameState(prev => ({
        ...prev,
        currentAdventure: { ...adventure, startTime: Date.now(), active: true },
        ninja: { ...prev.ninja, energy: prev.ninja.energy - 5 }
      }));
    }
  };

  const completeAdventure = () => {
    if (gameState.currentAdventure) {
      const rewards = gameState.currentAdventure.rewards;
      updateNinja({
        gold: gameState.ninja.gold + rewards.gold,
        experience: gameState.ninja.experience + rewards.experience
      });
      setGameState(prev => ({
        ...prev,
        currentAdventure: undefined
      }));
    }
  };

  const reviveNinja = () => {
    if (gameState.ninja.gems >= 5) {
      updateNinja({
        health: gameState.ninja.maxHealth,
        gems: gameState.ninja.gems - 5
      });
      setGameState(prev => ({ ...prev, isAlive: true }));
    }
  };

  const trainSkill = (skill: string) => {
    if (gameState.ninja.skillPoints > 0) {
      const updates: Partial<NinjaStats> = { skillPoints: gameState.ninja.skillPoints - 1 };
      
      switch (skill) {
        case 'attack':
          updates.attack = gameState.ninja.attack + 2;
          break;
        case 'defense':
          updates.defense = gameState.ninja.defense + 2;
          break;
        case 'speed':
          updates.speed = gameState.ninja.speed + 1;
          break;
        case 'luck':
          updates.luck = gameState.ninja.luck + 1;
          break;
      }
      
      updateNinja(updates);
    }
  };

  const collectIdleRewards = () => {
    const now = Date.now();
    const timeDiff = now - lastSaveTimeRef.current; // Use ref instead of gameState
    const minutesAway = Math.floor(timeDiff / (1000 * 60));
    
    if (minutesAway > 0) {
      // Calculate offline progress based on player level and stats
      const playerLevel = gameState.ninja.level || 1;
      const baseEnemiesPerMinute = Math.min(10 + Math.floor(playerLevel / 5), 50); // Cap at 50 enemies/min
      
      // Calculate total enemies defeated while offline (max 12 hours = 720 minutes)
      const maxOfflineMinutes = 720; // 12 hours cap
      const actualMinutes = Math.min(minutesAway, maxOfflineMinutes);
      const enemiesDefeated = actualMinutes * baseEnemiesPerMinute;
      
      // Calculate rewards (diminishing returns after 4 hours)
      const fourHours = 240; // 4 hours in minutes
      const baseRewardMultiplier = actualMinutes <= fourHours ? 1.0 : 0.5; // 50% efficiency after 4 hours
      
      const goldPerEnemy = 5 + Math.floor(playerLevel / 10);
      const expPerEnemy = 10 + Math.floor(playerLevel / 5);
      
      const totalGoldReward = Math.floor(enemiesDefeated * goldPerEnemy * baseRewardMultiplier);
      const totalExpReward = Math.floor(enemiesDefeated * expPerEnemy * baseRewardMultiplier);
      
      console.log(`⏰ Offline for ${actualMinutes} minutes (${(actualMinutes/60).toFixed(1)} hours)`);
      console.log(`🗡️ Defeated ${enemiesDefeated} enemies offline`);
      console.log(`💰 Earned ${totalGoldReward} gold, ${totalExpReward} XP offline`);
      
      if (totalGoldReward > 0 || totalExpReward > 0) {
        updateNinja({
          gold: gameState.ninja.gold + totalGoldReward,
          experience: gameState.ninja.experience + totalExpReward
        });
        
        // Trigger event-driven save for offline rewards
        saveOnEvent('offline_rewards');
      }
    }
  };

  // Legacy functions for backward compatibility
  const saveGame = () => saveGameToServer();
  const loadGame = () => loadGameFromServer();

  const value: GameContextType = {
    gameState,
    isLoading,
    updateNinja,
    addShuriken,
    equipShuriken,
    upgradeShuriken,
    addPet,
    setActivePet,
    feedPet,
    trainPet,
    startRaid,
    startAdventure,
    completeAdventure,
    reviveNinja,
    trainSkill,
    collectIdleRewards,
    saveGame,
    loadGame,
    updateZoneProgress,
    saveOnEvent,
    saveOnMilestone,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};