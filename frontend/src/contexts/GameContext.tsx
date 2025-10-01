import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';

export interface StatPool {
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  maxHealth: number;
  maxEnergy: number;
}

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
  reviveTickets: number; // Revival system currency
  
  // Separate stat pools
  baseStats: StatPool;        // Character's natural stats
  goldUpgrades: StatPool;     // Stats bought with gold
  skillPointUpgrades: StatPool; // Stats bought with skill points
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

export interface SubscriptionBenefits {
  xp_multiplier: number;
  drop_multiplier: number;
  zone_kill_multiplier: number;
  active_subscriptions: Array<{
    type: string;
    end_date: string;
    days_remaining: number;
  }>;
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
  isInvincible?: boolean; // Invincibility state after revival
  invincibilityEndTime?: number; // Timestamp when invincibility ends
  achievements: string[];
  unlockedFeatures: string[];
  zoneProgress?: Record<number, any>; // Zone progression data
  equipment?: {
    equipped: Record<string, any>; // Equipment slot -> Equipment mapping
    inventory: any[]; // Array of unequipped equipment
    maxInventorySize: number;
  }; // Equipment and inventory data
  abilityData?: {
    equippedAbilities: any[]; // Array of 5 equipped ability slots
    availableAbilities: Record<string, any>; // Map of ability ID to ability data with levels
    activeSynergies: any[]; // Current active synergies
  }; // Ability deck and progression data
  subscriptionBenefits: SubscriptionBenefits;
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
  revivePlayer: () => boolean;
  freeRespawn: () => void;
  purchaseReviveTickets: (quantity: number) => boolean;
  updateGameState: (updates: Partial<GameState>) => void; // Add updateGameState function
  trainSkill: (skill: string) => void;
  collectIdleRewards: () => void;
  saveGame: () => void;
  loadGame: () => void;
  updateZoneProgress: (zoneProgress: Record<number, any>) => void;
  updateEquipment: (equipment: {equipped: Record<string, any>; inventory: any[]; maxInventorySize: number}) => void; // For equipment saves
  updateAbilityData: (abilityData: {equippedAbilities: any[]; availableAbilities: Record<string, any>; activeSynergies: any[]}) => void; // For ability saves
  // EQUIPMENT INTEGRATION: Add effective stats calculation functions
  getEffectiveStats: () => NinjaStats; // Get ninja stats with equipment bonuses applied
  saveOnEvent: (eventType: string) => void;
  saveOnMilestone: (milestoneType: string) => void;
  loadSubscriptionBenefits: () => Promise<void>;
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
    reviveTickets: 3, // Start with 3 revival tickets
    
    // Separate stat pools for clear progression tracking
    baseStats: {
      attack: 10,
      defense: 5,
      speed: 8,
      luck: 3,
      maxHealth: 100,
      maxEnergy: 50,
    },
    goldUpgrades: {
      attack: 0,
      defense: 0,
      speed: 0,
      luck: 0,
      maxHealth: 0,
      maxEnergy: 0,
    },
    skillPointUpgrades: {
      attack: 0,
      defense: 0,
      speed: 0,
      luck: 0,
      maxHealth: 0,
      maxEnergy: 0,
    },
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
  abilityData: {
    equippedAbilities: [], // Empty - will be populated by AbilityManager defaults
    availableAbilities: {}, // Empty - will be populated by AbilityManager defaults
    activeSynergies: [], // No synergies initially
  },
  subscriptionBenefits: {
    xp_multiplier: 1.0,
    drop_multiplier: 1.0,
    zone_kill_multiplier: 1.0,
    active_subscriptions: [],
  },
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
  const [isLoading, setIsLoading] = useState(false); // Start with false, only set true when actually loading
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false); // Track if we've loaded real data
  const lastSaveTimeRef = useRef<number>(Date.now());

  const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  // Debug API URL to help diagnose network issues
  useEffect(() => {
    console.log('🔧 GameContext API Configuration:');
    console.log('  - Constants.expoConfig?.extra?.backendUrl:', Constants.expoConfig?.extra?.backendUrl);
    console.log('  - process.env.EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
    console.log('  - Final API_BASE_URL:', API_BASE_URL);
  }, [API_BASE_URL]);

  // Debug authentication state changes
  useEffect(() => {
    console.log('🔍 GAMECONTEXT AUTH STATE CHANGE:');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user exists:', !!user);
    console.log('  - user ID:', user?.id);
    console.log('  - token exists:', !!token);
  }, [isAuthenticated, user, token]);

  // Load subscription benefits from server
  const loadSubscriptionBenefits = useCallback(async () => {
    console.log('🔍 SUBSCRIPTION BENEFITS LOADING ATTEMPT:');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user exists:', !!user);
    console.log('  - token exists:', !!token);
    
    if (!isAuthenticated || !token) {
      console.log('❌ SUBSCRIPTION BENEFITS: Missing auth or token, skipping');
      return;
    }

    try {
      console.log('🏪 LOADING SUBSCRIPTION BENEFITS - Starting API call...');
      console.log('  - API_BASE_URL:', API_BASE_URL);
      console.log('  - Using token:', token?.substring(0, 10) + '...');
      
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/benefits`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 SUBSCRIPTION BENEFITS RESPONSE:', response.status, response.statusText);

      if (response.ok) {
        const benefits = await response.json();
        console.log('✅ LOADED SUBSCRIPTION BENEFITS:', JSON.stringify(benefits, null, 2));
        
        setGameState(prev => ({
          ...prev,
          subscriptionBenefits: benefits
        }));
      } else {
        console.error('❌ SUBSCRIPTION BENEFITS API ERROR:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ SUBSCRIPTION BENEFITS NETWORK ERROR:', error);
    }
  }, [isAuthenticated, token, API_BASE_URL]);

  // Load game data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🎮 LOADING GAME DATA AND SUBSCRIPTION BENEFITS...');
      loadGameFromServer().then(() => {
        // Load subscription benefits after game data
        console.log('🔄 GAME DATA LOADED, NOW LOADING SUBSCRIPTION BENEFITS...');
        // TODO: Re-enable after fixing circular dependency
        // loadSubscriptionBenefits();
      });
    } else {
      // No authenticated user - set loading to false immediately
      console.log('🔍 No authenticated user - setting game loading to false');
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Auto-save system - MOBILE FIX: Use state callback pattern to prevent stale closures
  useEffect(() => {
    console.log('🔍 Auto-save useEffect check:', {
      isAuthenticated,
      hasUser: !!user,
      hasLoadedFromServer,
    });
    
    // CRITICAL: Don't start auto-save until game data has loaded
    if (!isAuthenticated || !user || !hasLoadedFromServer) {
      console.log('❌ Auto-save blocked - waiting for:', {
        needsAuth: !isAuthenticated,
        needsUser: !user,
        needsLoadedFlag: !hasLoadedFromServer
      });
      return;
    }

    console.log('⏰ Starting auto-save system - user authenticated and game data loaded');
    
    const interval = setInterval(() => {
      // MOBILE FIX: Use state callback to read current state at execution time, not closure creation time
      setGameState(currentState => {
        console.log('⏰ Auto-save triggered - Level:', currentState.ninja.level, 'XP:', currentState.ninja.experience);
        
        // Save the current state (not stale closure state)
        if (isAuthenticated && user) {
          // Pass current state to save function to avoid stale closure
          saveGameToServerWithState(currentState);
          collectIdleRewardsWithState(currentState);
        }
        
        // Return state unchanged
        return currentState;
      });
    }, Platform.OS === 'web' ? 10000 : 30000); // MOBILE OPTIMIZATION: 30 seconds on mobile to prevent performance issues

    return () => {
      console.log('🛑 Auto-save interval cleared');
      clearInterval(interval);
    };
  }, [isAuthenticated, user, hasLoadedFromServer]); // CRITICAL FIX: Remove gameState from deps to prevent interval recreation

  // Event-driven saves - Save on important game events
  const saveOnEvent = useCallback((eventType: string) => {
    if (isAuthenticated) {
      console.log(`🔥 EVENT-DRIVEN SAVE TRIGGERED: ${eventType} - bypassing all loading guards`);
      // CRITICAL FIX: Use current gameState directly, don't use setGameState callback
      saveGameToServerWithState(gameState, true); // Force save for events with current state
    }
  }, [isAuthenticated, gameState]);

  // Critical milestone save - Save immediately on very important events
  const saveOnMilestone = useCallback((milestoneType: string) => {
    if (isAuthenticated) {
      console.log(`🏆 MILESTONE SAVE TRIGGERED: ${milestoneType} - bypassing all loading guards`);
      console.log(`🏆 MILESTONE SAVE - Current state Level: ${gameState.ninja.level}, XP: ${gameState.ninja.experience}`);
      // CRITICAL FIX: Use current gameState directly, don't use setGameState callback  
      saveGameToServerWithState(gameState, true); // Force save for milestones with current state
    }
  }, [isAuthenticated, gameState]);

  // Calculate experience required for next level (BALANCED PROGRESSION)
  const calculateExpForLevel = (level: number): number => {
    if (level <= 1) return 100;
    if (level >= 15000) return 50000; // Reduced max exp requirement for endgame
    
    // BALANCED SCALING: Higher requirements for levels 1-5000, then faster progression
    if (level <= 5000) {
      // SLOWER progression for early-mid game (levels 1-5000)
      const baseExp = 200; // INCREASED base EXP requirement for slower early progression
      const growthRate = 1.05; // INCREASED growth rate for more challenging early levels
      const expRequired = Math.floor(baseExp * Math.pow(growthRate, level - 1));
      
      // Cap at 100,000 for levels 1-5000 to prevent extreme requirements
      return Math.min(expRequired, 100000);
    } else {
      // FASTER progression for high levels (5001-15000) - keeps original fast scaling
      const baseExp = 80; // Reduced base EXP requirement for faster high-level progression
      const growthRate = 1.03; // Reduced growth rate for faster progression
      const levelOffset = level - 5000; // Start calculation from level 5000 baseline
      const expRequired = Math.floor(baseExp * Math.pow(growthRate, levelOffset));
      
      // Cap at 50,000 for high levels for fast endgame progression
      return Math.min(expRequired, 50000);
    }
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
      currentExp = Math.round(currentExp - currentExpToNext); // Ensure experience remains integer
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
      updates.experience = Math.round(currentExp); // Ensure experience is always integer
      updates.experienceToNext = Math.round(currentExpToNext); // Ensure experienceToNext is always integer
    }

    return updates;
  };

  const saveGameToServerWithState = async (currentState: GameState, forceEventSave = false) => {
    if (!isAuthenticated || !user?.id) {
      console.warn('🚫 Cannot save game: user not authenticated');
      return;
    }

    // MOBILE FIX: Prevent saving default data before real game data loads
    // BUT allow event-driven saves (level-ups, purchases) to bypass this guard
    if (!hasLoadedFromServer && !forceEventSave) {
      console.warn('🚫 Preventing premature save: game data not loaded yet from server');
      return;
    }
    
    if (forceEventSave) {
      console.log('🔥 FORCING EVENT-DRIVEN SAVE - bypassing loading guards');
    }

    // SECURITY: Server-only saves, no local storage to prevent save file editing
    
    console.log('✅ SAVE WITH CURRENT STATE - Removing stale closure');
    console.log('💾 SAVING CURRENT STATE:', 'Level:', currentState.ninja.level, 'XP:', currentState.ninja.experience, 'Gold:', currentState.ninja.gold, 'Gems:', currentState.ninja.gems);
    
    // CRITICAL DEBUG: Compare what we're about to save vs what UI displays
    console.log('🔍 CRITICAL STATE COMPARISON:');
    console.log('  📊 Current ninja state (BEING SAVED):', {
      level: currentState.ninja.level,
      experience: currentState.ninja.experience, 
      gold: currentState.ninja.gold,
      gems: currentState.ninja.gems
    });

    try {
      const now = Date.now();
      const saveUrl = `${API_BASE_URL}/api/save-game`;
      console.log('💾 ATTEMPTING SAVE TO:', saveUrl);
      
      const saveData = {
        playerId: user.id,
        ninja: {
          ...currentState.ninja,
          experience: Math.round(currentState.ninja.experience), // Ensure experience is always integer
          gold: Math.round(currentState.ninja.gold), // Ensure gold is always integer
        },
        shurikens: currentState.shurikens,
        pets: currentState.pets,
        achievements: currentState.achievements,
        unlockedFeatures: currentState.unlockedFeatures,
        zoneProgress: currentState.zoneProgress || { 1: { zoneId: 1, currentLevel: 1, killsInLevel: 0, completed: false } },
        equipment: currentState.equipment || null, // Include equipment data
        abilityData: currentState.abilityData || null, // Include ability data
        subscriptionBenefits: currentState.subscriptionBenefits, // Include subscription benefits
      };

      console.log('🚀 SAVE REQUEST STARTING - URL:', saveUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(saveUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(saveData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId); // Clear timeout if request completes
      console.log('📡 SAVE RESPONSE RECEIVED - Status:', response.status, 'OK:', response.ok);
      
      if (!response.ok) {
        // Get more detailed error information
        let errorDetails = '';
        try {
          const errorText = await response.text();
          errorDetails = ` - Details: ${errorText}`;
          console.error('❌ SAVE ERROR DETAILS:', errorText);
        } catch (textError) {
          console.error('❌ Could not read error text:', textError);
        }
        throw new Error(`Save failed: ${response.status}${errorDetails}`);
      }

      const result = await response.json();
      lastSaveTimeRef.current = now;
      console.log('✅ PROGRESS SAVED TO SERVER - Level:', result.ninja?.level, 'XP:', result.ninja?.experience);
    } catch (error) {
      console.error('❌ Server save failed:', error);
      console.error('❌ Save error details:', {
        message: error.message,
        stack: error.stack,
        apiUrl: API_BASE_URL,
        isAuthenticated,
        hasToken: !!token
      });
      // SECURITY: No local backup - all progress must be saved to server for integrity
      throw error; // Propagate error since we can't rely on local backup anymore
    }
  };

  const saveGameToServer = async (forceEventSave = false) => {
    // Wrapper that uses current gameState (for backwards compatibility)
    return saveGameToServerWithState(gameState, forceEventSave);
  };

  const loadGameFromServer = async () => {
    if (!isAuthenticated || !user?.id) {
      console.warn('❌ Cannot load game: user not authenticated. Auth:', isAuthenticated, 'User ID:', user?.id);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 LOADING GAME DATA - User ID:', user.id);
      
      const response = await fetch(`${API_BASE_URL}/api/load-game/${user.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      console.log('📡 Load response status:', response.status);

      if (!response.ok) {
        throw new Error(`Load failed: ${response.status}`);
      }

      const savedData = await response.json();
      console.log('📥 LOAD RESPONSE:', savedData ? 'Data found' : 'No data');
      
      if (savedData && savedData.ninja) {
        console.log('📊 LOADING YOUR REAL PROGRESS:');
        console.log('  - API returned Level:', savedData.ninja.level);
        console.log('  - API returned XP:', savedData.ninja.experience);
        console.log('  - API returned Gold:', savedData.ninja.gold);
        console.log('  - API returned Gems:', savedData.ninja.gems);
        console.log('  - API returned Skill Points:', savedData.ninja.skillPoints);
        
        // Server returned valid game data
        const loadedGameState: GameState = {
          ninja: savedData.ninja,
          shurikens: savedData.shurikens || [],
          pets: savedData.pets || [],
          raids: defaultGameState.raids,
          adventures: defaultGameState.adventures,
          lastSaveTime: new Date(savedData.lastSaveTime).getTime(),
          isAlive: savedData.isAlive !== false,
          achievements: savedData.achievements || [],
          unlockedFeatures: savedData.unlockedFeatures || ['stats', 'shurikens'],
          zoneProgress: savedData.zoneProgress || { 1: { zoneId: 1, currentLevel: 1, killsInLevel: 0, completed: false } },
          equipment: savedData.equipment || defaultGameState.equipment,
          abilityData: savedData.abilityData || defaultGameState.abilityData,
          subscriptionBenefits: savedData.subscriptionBenefits || defaultGameState.subscriptionBenefits,
        };
        
        console.log('🎯 SETTING GAME STATE TO:');
        console.log('  - Level:', loadedGameState.ninja.level);
        console.log('  - XP:', loadedGameState.ninja.experience);
        console.log('  - Gold:', loadedGameState.ninja.gold);
        console.log('  - Gems:', loadedGameState.ninja.gems);
        
        lastSaveTimeRef.current = loadedGameState.lastSaveTime;
        setGameState(loadedGameState);
        setHasLoadedFromServer(true);
        console.log('✅ REAL PROGRESS LOADED - Level:', loadedGameState.ninja.level, 'XP:', loadedGameState.ninja.experience, 'Gold:', loadedGameState.ninja.gold, 'Gems:', loadedGameState.ninja.gems);
        console.log('🔓 hasLoadedFromServer set to TRUE - saves now enabled');
        
        // Verify game state was set correctly
        setTimeout(() => {
          console.log('🔍 VERIFYING GAME STATE SET CORRECTLY:');
          console.log('  - Current gameState Level:', gameState.ninja.level);
          console.log('  - Current gameState XP:', gameState.ninja.experience);
        }, 1000);
      } else {
        // No server data, new player starts with defaults
        console.log('🆕 NO SERVER DATA - New player starting with defaults');
        setGameState(defaultGameState);
        setHasLoadedFromServer(true);
      }
    } catch (error) {
      console.error('❌ LOAD GAME ERROR:', error);
      // On error, use default state and mark as loaded
      console.log('🆕 LOAD ERROR - Using default state');
      setGameState(defaultGameState);
      setHasLoadedFromServer(true);
    } finally {
      // CRITICAL: Always set loading to false
      console.log('🏁 Game loading completed, setting isLoading to false');
      setIsLoading(false);
    }
  };

  // LOCAL BACKUP REMOVED: All saves now go through server only for security

  const collectIdleRewardsWithState = (currentState: GameState) => {
    const now = Date.now();
    const timeDiff = now - lastSaveTimeRef.current; // Use ref instead of gameState
    const minutesAway = Math.floor(timeDiff / (1000 * 60));
    
    if (minutesAway > 0) {
      // Calculate offline progress based on player level and stats
      const playerLevel = currentState.ninja.level || 1;
      const offlineXP = Math.floor(minutesAway * playerLevel * 0.5); // Reduced offline rate
      const offlineGold = Math.floor(minutesAway * playerLevel * 2);
      
      if (offlineXP > 0) {
        console.log(`💰 Idle rewards - ${minutesAway} minutes: ${offlineXP} XP, ${offlineGold} gold`);
        
        // Award idle rewards using current state
        updateNinja(prev => ({
          experience: prev.experience + offlineXP,
          gold: prev.gold + offlineGold,
        }));
        
        lastSaveTimeRef.current = now;
      }
    }
  };

  const collectIdleRewards = () => {
    return collectIdleRewardsWithState(gameState);
  };

  // LOCAL BACKUP LOADING REMOVED: All game data comes from server only for security

  const updateZoneProgress = (zoneProgress: Record<number, any>) => {
    setGameState(prev => ({
      ...prev,
      zoneProgress
    }));
    
    // MILESTONE SAVE: Zone progression is critical - save immediately
    if (isAuthenticated) {
      console.log('🗺️ MILESTONE: Zone progression updated - IMMEDIATE SAVE');
      saveOnMilestone('zone_progression');
    }
  };

  const updateEquipment = (equipment: {equipped: Record<string, any>; inventory: any[]; maxInventorySize: number}) => {
    setGameState(prev => ({
      ...prev,
      equipment
    }));
    
    // MILESTONE SAVE: Equipment changes are critical - save immediately
    if (isAuthenticated) {
      console.log('⚔️ MILESTONE: Equipment updated - IMMEDIATE SAVE');
      saveOnMilestone('equipment_update');
    }
  };

  const updateAbilityData = (abilityData: {equippedAbilities: any[]; availableAbilities: Record<string, any>; activeSynergies: any[]}) => {
    setGameState(prev => ({
      ...prev,
      abilityData
    }));
    
    // ABILITY SAVE: Use deferred save to prevent spam - abilities are saved with regular auto-save
    console.log('✨ ABILITY DATA UPDATE - Data updated, will save with next auto-save');
  };

  const updateNinja = (updates: Partial<NinjaStats> | ((prev: NinjaStats) => Partial<NinjaStats>)) => {
    // MOBILE DEBUG: Log all updateNinja calls to trace combat progress
    console.log('🥷 MOBILE DEBUG - updateNinja CALLED:', {
      updatesType: typeof updates,
      timestamp: Date.now(),
      platform: Platform.OS,
      updates: typeof updates === 'function' ? 'FUNCTION' : updates
    });
    
    setGameState(prev => {
      console.log('🥷 MOBILE DEBUG - BEFORE UPDATE:', {
        currentLevel: prev.ninja.level,
        currentXP: prev.ninja.experience,
        currentGold: prev.ninja.gold,
        currentGems: prev.ninja.gems
      });
      
      // Handle both object updates and function updates
      const actualUpdates = typeof updates === 'function' 
        ? updates(prev.ninja)
        : updates;
        
      // SAFEGUARD: Ensure numeric fields are always integers before processing
      if (actualUpdates && typeof actualUpdates === 'object') {
        if (actualUpdates.experience !== undefined) {
          actualUpdates.experience = Math.round(actualUpdates.experience);
        }
        if (actualUpdates.gold !== undefined) {
          actualUpdates.gold = Math.round(actualUpdates.gold);
        }
        if (actualUpdates.gems !== undefined) {
          actualUpdates.gems = Math.round(actualUpdates.gems);
        }
        if (actualUpdates.experienceToNext !== undefined) {
          actualUpdates.experienceToNext = Math.round(actualUpdates.experienceToNext);
        }
      }
        
      console.log('🥷 MOBILE DEBUG - ACTUAL UPDATES (after rounding):', actualUpdates);
        
      const updatedNinja = { ...prev.ninja, ...actualUpdates };
      
      // Check for level up with new system
      const levelUpUpdates = handleLevelUp(updatedNinja);
      const finalNinja = { ...updatedNinja, ...levelUpUpdates };
      
      console.log('🥷 MOBILE DEBUG - AFTER UPDATE:', {
        finalLevel: finalNinja.level,
        finalXP: finalNinja.experience,
        finalGold: finalNinja.gold,
        finalGems: finalNinja.gems,
        hadLevelUp: Object.keys(levelUpUpdates).length > 0
      });
      
      const newGameState = {
        ...prev,
        ninja: finalNinja
      };
      
      // AGGRESSIVE Event-driven saves - Save immediately on ANY important event
      if (isAuthenticated) {
        // CRITICAL MILESTONE: Level up - Save deferred to prevent render-phase violations
        if (finalNinja.level > prev.ninja.level) {
          console.log('🏆 CRITICAL MILESTONE: Level up - DEFERRED SAVE');
          setTimeout(() => saveOnMilestone('level_up'), 0); // Mobile fix: defer to next event loop
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
        // MILESTONE: Skill points gained - Save skill point awards immediately
        else if (finalNinja.skillPoints > prev.ninja.skillPoints) {
          console.log('🎯 MILESTONE: Skill points gained - SAVE');
          setTimeout(() => saveOnMilestone('skill_points_gained'), 0);
        }
        // MILESTONE: Skill point spending - Save character development
        else if (finalNinja.skillPoints < prev.ninja.skillPoints) {
          console.log('📈 MILESTONE: Skill points spent - SAVE');
          setTimeout(() => saveOnMilestone('skill_upgrade'), 0);
        }
        // MILESTONE: Gold/Skill Point upgrades - Save character tab upgrades immediately
        else if (JSON.stringify(finalNinja.goldUpgrades) !== JSON.stringify(prev.ninja.goldUpgrades) ||
                 JSON.stringify(finalNinja.skillPointUpgrades) !== JSON.stringify(prev.ninja.skillPointUpgrades)) {
          console.log('🔧 MILESTONE: Character upgrades applied - SAVE');
          setTimeout(() => saveOnMilestone('character_upgrades'), 0);
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

  // Revival system functions
  const revivePlayer = useCallback(() => {
    if (gameState.ninja.reviveTickets > 0) {
      console.log('💖 PLAYER REVIVED using ticket! Granting 5 seconds of invincibility...');
      
      const effectiveStats = getEffectiveStats();
      const invincibilityEndTime = Date.now() + 5000; // 5 seconds from now
      
      console.log(`🔍 REVIVAL DEBUG: Current health=${gameState.ninja.health}, Max health=${effectiveStats.maxHealth}`);
      
      setGameState(prevState => ({
        ...prevState,
        isAlive: true,
        isInvincible: true, // Grant invincibility
        invincibilityEndTime, // Set end time
        ninja: {
          ...prevState.ninja,
          health: effectiveStats.maxHealth, // FIXED: Full health restore to MAX health
          reviveTickets: prevState.ninja.reviveTickets - 1 // Use 1 ticket
        }
      }));
      
      console.log(`✅ REVIVAL COMPLETE: Set health to ${effectiveStats.maxHealth}`);
      
      // Remove invincibility after 5 seconds
      setTimeout(() => {
        console.log('🛡️ Invincibility expired!');
        setGameState(prev => ({
          ...prev,
          isInvincible: false,
          invincibilityEndTime: undefined
        }));
      }, 5000);
      
      return true; // Successfully revived
    }
    return false; // No tickets available
  }, [gameState.ninja.reviveTickets, getEffectiveStats]);

  const freeRespawn = useCallback(() => {
    console.log('♻️ PLAYER FREE RESPAWN! Granting 5 seconds of invincibility...');
    
    const effectiveStats = getEffectiveStats();
    const invincibilityEndTime = Date.now() + 5000; // 5 seconds from now
    
    console.log(`🔍 FREE RESPAWN DEBUG: Current health=${gameState.ninja.health}, Max health=${effectiveStats.maxHealth}`);
    
    setGameState(prevState => ({
      ...prevState,
      isAlive: true,
      isInvincible: true, // Grant invincibility
      invincibilityEndTime, // Set end time
      ninja: {
        ...prevState.ninja,
        health: effectiveStats.maxHealth, // FIXED: Full health restore to MAX health
        // No ticket cost for free respawn
      }
    }));
    
    console.log(`✅ FREE RESPAWN COMPLETE: Set health to ${effectiveStats.maxHealth}`);
    
    // Remove invincibility after 5 seconds
    setTimeout(() => {
      console.log('🛡️ Invincibility expired!');
      setGameState(prev => ({
        ...prev,
        isInvincible: false,
        invincibilityEndTime: undefined
      }));
    }, 5000);
  }, [getEffectiveStats, gameState.ninja.health]);

  // Function to purchase revive tickets with gems
  const purchaseReviveTickets = useCallback((quantity: number) => {
    const ticketsPerGem = 50 / 1000; // 50 tickets for 1000 gems = 0.05 tickets per gem
    const gemsRequired = Math.ceil(quantity / ticketsPerGem); // 1000 gems for 50 tickets
    
    if (gameState.ninja.gems >= gemsRequired) {
      setGameState(prevState => ({
        ...prevState,
        ninja: {
          ...prevState.ninja,
          gems: prevState.ninja.gems - gemsRequired,
          reviveTickets: prevState.ninja.reviveTickets + quantity
        }
      }));
      
      console.log(`💎 Purchased ${quantity} revive tickets for ${gemsRequired} gems`);
      return true;
    }
    
    console.log(`❌ Not enough gems to purchase ${quantity} tickets (need ${gemsRequired}, have ${gameState.ninja.gems})`);
    return false;
  }, [gameState.ninja.gems, gameState.ninja.reviveTickets]);

  // Legacy reviveNinja function for backward compatibility
  const reviveNinja = () => {
    if (gameState.ninja.gems >= 5) {
      updateNinja({
        health: gameState.ninja.maxHealth,
        gems: gameState.ninja.gems - 5
      });
      setGameState(prev => ({ ...prev, isAlive: true }));
      
      // MOBILE FIX: Save gem purchase immediately
      console.log('💎 GEM PURCHASE - Revive ninja (5 gems spent)');
      saveOnEvent('gem_purchase_revive');
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
      
      // MILESTONE: Skill training - Critical save
      saveOnMilestone('skill_training');
    }
  };

  // Legacy functions for backward compatibility
  const saveGame = () => saveGameToServer();
  const loadGame = () => loadGameFromServer();

  // Update general game state (for Revival System and other general state changes)
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    console.log('🎮 UPDATING GAME STATE:', updates);
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      
      // MILESTONE SAVE: Critical game state changes
      if (isAuthenticated && updates.isAlive !== undefined) {
        console.log('💀 CRITICAL STATE CHANGE: Player death/revival - IMMEDIATE SAVE');
        setTimeout(() => saveOnMilestone('player_death_revival'), 0);
      }
      
      return newState;
    });
  }, [isAuthenticated, saveOnMilestone]);

  // SEPARATE STAT POOLS: Calculate effective stats combining all sources
  const getEffectiveStats = useCallback((): NinjaStats => {
    const ninja = gameState.ninja;
    const equipment = gameState.equipment;
    
    // Initialize with base stats or fallback to current values for existing saves
    const baseStats = ninja.baseStats || {
      attack: ninja.attack,
      defense: ninja.defense,
      speed: ninja.speed,
      luck: ninja.luck,
      maxHealth: ninja.maxHealth,
      maxEnergy: ninja.maxEnergy,
    };
    
    const goldUpgrades = ninja.goldUpgrades || {
      attack: 0, defense: 0, speed: 0, luck: 0, maxHealth: 0, maxEnergy: 0,
    };
    
    const skillPointUpgrades = ninja.skillPointUpgrades || {
      attack: 0, defense: 0, speed: 0, luck: 0, maxHealth: 0, maxEnergy: 0,
    };
    
    // Calculate equipment bonuses
    let equipmentBonuses = {
      attack: 0,
      defense: 0,
      speed: 0,
      luck: 0,
      maxHealth: 0,
      maxEnergy: 0,
    };

    // Sum up bonuses from all equipped items
    if (equipment && equipment.equipped) {
      Object.values(equipment.equipped).forEach((item: any) => {
        if (item && item.currentStats) {
          Object.entries(item.currentStats).forEach(([key, value]: [string, any]) => {
            // Map equipment stat names to ninja stat names
            const statKey = key === 'hp' ? 'maxHealth' : key;
            if (equipmentBonuses.hasOwnProperty(statKey)) {
              equipmentBonuses[statKey as keyof typeof equipmentBonuses] += value;
            }
          });
        }
      });
    }

    // Combine all stat sources: Base + Gold Upgrades + Skill Point Upgrades + Equipment
    const combinedStats = {
      attack: baseStats.attack + goldUpgrades.attack + skillPointUpgrades.attack + equipmentBonuses.attack,
      defense: baseStats.defense + goldUpgrades.defense + skillPointUpgrades.defense + equipmentBonuses.defense,
      speed: baseStats.speed + goldUpgrades.speed + skillPointUpgrades.speed + equipmentBonuses.speed,
      luck: baseStats.luck + goldUpgrades.luck + skillPointUpgrades.luck + equipmentBonuses.luck,
      maxHealth: baseStats.maxHealth + goldUpgrades.maxHealth + skillPointUpgrades.maxHealth + equipmentBonuses.maxHealth,
      maxEnergy: baseStats.maxEnergy + goldUpgrades.maxEnergy + skillPointUpgrades.maxEnergy + equipmentBonuses.maxEnergy,
    };

    // Return full ninja stats with combined values
    return {
      ...ninja,
      attack: combinedStats.attack,
      defense: combinedStats.defense,
      speed: combinedStats.speed,
      luck: combinedStats.luck,
      maxHealth: combinedStats.maxHealth,
      maxEnergy: combinedStats.maxEnergy,
      
      // Add stat breakdown for debugging/display
      baseStats,
      goldUpgrades,
      skillPointUpgrades,
    };
  }, [gameState.ninja, gameState.equipment]);

  const value: GameContextType = React.useMemo(() => ({
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
    revivePlayer,
    freeRespawn,
    purchaseReviveTickets,
    updateGameState,
    trainSkill,
    collectIdleRewards,
    saveGame,
    loadGame,
    updateZoneProgress,
    updateEquipment,
    updateAbilityData,
    getEffectiveStats,
    saveOnEvent,
    saveOnMilestone,
    // loadSubscriptionBenefits, // Temporarily removed due to initialization issues
  }), [
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
    revivePlayer,
    freeRespawn,
    purchaseReviveTickets,
    updateGameState, // Add updateGameState to dependencies
    trainSkill,
    collectIdleRewards,
    saveGame,
    loadGame,
    updateZoneProgress,
    updateEquipment, // MOBILE FIX: Add equipment update function to dependencies
    updateAbilityData,
    getEffectiveStats,
    saveOnEvent,
    saveOnMilestone,
    // loadSubscriptionBenefits, // Temporarily removed due to initialization issues
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};