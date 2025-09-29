import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ZONES, ENEMY_TYPES, calculateEnemyStats, getZoneByLevel, isZoneUnlocked, Zone, ZoneLevel } from '../data/ZoneData';
import { useGame } from './GameContext';

// Helper function for fallback kill requirements (matches ZoneData.ts)
const calculateKillRequirement = (zoneId: number, level: number): number => {
  if (zoneId <= 5) return 25 + (level * 5);      // Zones 1-5: 30-50 kills per level
  if (zoneId <= 15) return 40 + (level * 10);     // Zones 6-15: 50-90 kills per level  
  if (zoneId <= 30) return 60 + (level * 15);     // Zones 16-30: 75-135 kills per level
  if (zoneId <= 45) return 100 + (level * 20);    // Zones 31-45: 120-200 kills per level
  return 150 + (level * 25);                      // Zones 46-50: 175-275 kills per level (endgame)
};

interface ZoneProgress {
  zoneId: number;
  currentLevel: number;
  killsInLevel: number;
  completed: boolean;
}

interface CurrentEnemy {
  id: string;
  typeId: string;
  name: string;
  icon: string;
  hp: number;
  maxHP: number;
  attack: number;
  xp: number;
  resistances?: any;
  position: { x: number; y: number };
  lastDamaged: number;
}

interface ZoneContextType {
  currentZone: Zone | null; // Currently selected zone for gameplay
  currentZoneLevel: ZoneLevel | null;
  progressionZone: Zone | null; // Highest unlocked zone for progression
  zoneProgress: Record<number, ZoneProgress>;
  availableZones: Zone[];
  
  // Zone Management
  selectZone: (zoneId: number, levelNumber: number) => boolean;
  getZoneProgress: (zoneId: number) => ZoneProgress | null;
  
  // Enemy Management  
  spawnZoneEnemy: () => CurrentEnemy | null;
  recordEnemyKill: (enemy: CurrentEnemy) => void;
  
  // Progress
  isZoneUnlocked: (zoneId: number) => boolean;
  getUnlockedZones: () => Zone[];
}

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

export const useZone = () => {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within a ZoneProvider');
  }
  return context;
};

export const ZoneProvider = ({ children }: { children: ReactNode }) => {
  const { gameState, updateZoneProgress } = useGame();
  
  // Zone State - Separate "progression" from "currently selected" zones
  const [currentZone, setCurrentZone] = useState<Zone | null>(ZONES[0]); // Currently selected zone for gameplay
  const [currentZoneLevel, setCurrentZoneLevel] = useState<ZoneLevel | null>(ZONES[0]?.levels[0] || null);
  const [progressionZone, setProgressionZone] = useState<Zone | null>(ZONES[0]); // Highest unlocked zone for progression
  const [zoneProgress, setZoneProgress] = useState<Record<number, ZoneProgress>>(() => {
    // MOBILE FIX: Initialize with saved zone progress from GameContext instead of defaults
    const savedProgress = gameState?.zoneProgress;
    if (savedProgress && Object.keys(savedProgress).length > 0) {
      console.log('🗺️ Loading saved zone progress:', savedProgress);
      return savedProgress;
    } else {
      console.log('🗺️ No saved zone progress, using defaults');
      return { 1: { zoneId: 1, currentLevel: 1, killsInLevel: 0, completed: false } };
    }
  });

  // MOBILE FIX: Update local zone progress when GameContext zone progress changes (on load)
  useEffect(() => {
    if (gameState?.zoneProgress && Object.keys(gameState.zoneProgress).length > 0) {
      console.log('🔄 Syncing zone progress from GameContext:', gameState.zoneProgress);
      setZoneProgress(gameState.zoneProgress);
    }
  }, [gameState?.zoneProgress]);

  // Initialize default zone based on player level
  useEffect(() => {
    if (gameState?.ninja) {
      const recommendedZone = getZoneByLevel(gameState.ninja.level);
      if (recommendedZone && !currentZone) {
        setCurrentZone(recommendedZone);
        setCurrentZoneLevel(recommendedZone.levels[0]);
      }
    }
  }, [gameState?.ninja?.level]);

  // Zone selection and management - separate from progression
  const selectZone = (zoneId: number, levelNumber: number): boolean => {
    if (!isZoneUnlockedLocal(zoneId)) {
      console.log(`❌ Zone ${zoneId} is not unlocked`);
      return false;
    }

    const zone = ZONES.find(z => z.id === zoneId);
    if (!zone) {
      console.log(`❌ Zone ${zoneId} not found`);
      return false;
    }

    const level = zone.levels[levelNumber - 1];
    if (!level) {
      console.log(`❌ Zone ${zoneId} Level ${levelNumber} not found`);
      return false;
    }

    console.log(`🎯 ZONE SELECTION: Setting currentZone to Zone ${zoneId} Level ${levelNumber} (${zone.name})`);
    console.log(`📍 BEFORE: currentZone=${currentZone?.id}, currentLevel=${currentZoneLevel?.level}`);
    
    setCurrentZone(zone);
    setCurrentZoneLevel(level);
    
    console.log(`📍 AFTER: Selected Zone ${zoneId} Level ${levelNumber} - Kills will count toward this zone`);
    return true;
  };

  // Get progress for specific zone
  const getZoneProgress = (zoneId: number): ZoneProgress | null => {
    return zoneProgress[zoneId] || null;
  };

  // Spawn enemy based on current zone/level
  const spawnZoneEnemy = (): CurrentEnemy | null => {
    if (!currentZone || !currentZoneLevel) {
      console.log('❌ No zone/level selected for enemy spawning');
      return null;
    }

    // Randomly select enemy type from current level
    const enemyTypeIds = currentZoneLevel.enemyTypes;
    const randomEnemyTypeId = enemyTypeIds[Math.floor(Math.random() * enemyTypeIds.length)];
    const enemyType = ENEMY_TYPES[randomEnemyTypeId];
    
    if (!enemyType) {
      console.log(`❌ Enemy type ${randomEnemyTypeId} not found`);
      return null;
    }

    // Calculate scaled stats
    const scaledStats = calculateEnemyStats(enemyType, currentZoneLevel, currentZone.id);
    
    // Create enemy instance
    const enemy: CurrentEnemy = {
      id: `${randomEnemyTypeId}_${Date.now()}_${Math.random()}`,
      typeId: randomEnemyTypeId,
      name: enemyType.name,
      icon: enemyType.icon,
      hp: scaledStats.hp,
      maxHP: scaledStats.hp,
      attack: scaledStats.attack,
      xp: scaledStats.xp,
      resistances: scaledStats.resistances,
      position: {
        x: Math.random() * 300 + 50, // Random position in game area
        y: Math.random() * 400 + 100
      },
      lastDamaged: 0
    };

    console.log(`🐺 Spawned ${enemy.name} (${enemy.hp} HP, ${enemy.xp} XP) in ${currentZone.name}`);
    return enemy;
  };

  // Record enemy kill and update progress
  const recordEnemyKill = (enemy: CurrentEnemy) => {
    if (!currentZone || !currentZoneLevel) return;

    console.log(`💀 ${enemy.name} killed! +${enemy.xp} XP`);
    
    setZoneProgress(prev => {
      const newProgress = { ...prev };
      const zoneId = currentZone.id;
      
      if (!newProgress[zoneId]) {
        newProgress[zoneId] = {
          zoneId,
          currentLevel: 1,
          killsInLevel: 0,
          completed: false
        };
      }
      
      const progress = { ...newProgress[zoneId] };
      
      // Get the required kills for current level from zone data
      const currentZoneLevel = currentZone.levels[progress.currentLevel - 1];
      const requiredKills = currentZoneLevel ? currentZoneLevel.requiredKills : calculateKillRequirement(zoneId, progress.currentLevel);
      
      // Check if this kill will complete the level
      const willCompleteLevel = (progress.killsInLevel + 1) >= requiredKills;
      
      if (willCompleteLevel) {
        console.log(`🎉 Level ${progress.currentLevel} completed in ${currentZone.name}!`);
        
        // Complete the level: set kills to requirement and advance
        progress.killsInLevel = requiredKills;
        
        console.log(`📊 Zone ${zoneId} Level ${progress.currentLevel}: ${progress.killsInLevel}/${requiredKills} kills (COMPLETED)`);
      } else {
        // Normal kill increment
        progress.killsInLevel += 1;
        console.log(`📊 Zone ${zoneId} Level ${progress.currentLevel}: ${progress.killsInLevel}/${requiredKills} kills`);
      }
      
      // Handle level advancement if completed
      if (willCompleteLevel) {
        console.log(`🎉 Level ${progress.currentLevel} completed in ${currentZone.name}!`);
        
        // Advance to next level if available
        if (progress.currentLevel < 5) {
          progress.currentLevel += 1;
          progress.killsInLevel = 0;
          console.log(`⬆️ Advanced to Level ${progress.currentLevel}`);
          
          // Auto-select next level
          const nextLevel = currentZone.levels[progress.currentLevel - 1];
          if (nextLevel) {
            setCurrentZoneLevel(nextLevel);
          }
        } else {
          // Zone completed
          progress.completed = true;
          console.log(`🏆 Zone ${currentZone.name} completed! Next zone unlocked.`);
        }
      }
      
      newProgress[zoneId] = progress;
      
      // MOBILE FIX: Defer GameContext update to prevent cross-component render-phase violations
      setTimeout(() => {
        console.log(`💾 Updating GameContext with zone progress:`, newProgress);
        updateZoneProgress(newProgress);
      }, 0); // Defer to next event loop to prevent setState-in-render error
      
      return newProgress;
    });
  };

  // Check if zone is unlocked
  const isZoneUnlockedLocal = (zoneId: number): boolean => {
    if (zoneId === 1) return true; // First zone always unlocked
    
    const zone = ZONES.find(z => z.id === zoneId);
    if (!zone?.unlockRequirement.previousZone) return true;
    
    const prevZoneProgress = zoneProgress[zone.unlockRequirement.previousZone];
    return prevZoneProgress?.completed || false;
  };

  // Get all unlocked zones
  const getUnlockedZones = (): Zone[] => {
    return ZONES.filter(zone => isZoneUnlockedLocal(zone.id));
  };

  const contextValue: ZoneContextType = React.useMemo(() => ({
    currentZone, // Currently selected zone for gameplay
    currentZoneLevel,
    progressionZone, // Highest unlocked zone for progression
    zoneProgress,
    availableZones: ZONES,
    selectZone,
    getZoneProgress,
    spawnZoneEnemy,
    recordEnemyKill,
    isZoneUnlocked: isZoneUnlockedLocal,
    getUnlockedZones,
  }), [
    currentZone,
    currentZoneLevel,
    progressionZone,
    zoneProgress,
    selectZone,
    getZoneProgress,
    spawnZoneEnemy,
    recordEnemyKill,
    isZoneUnlockedLocal,
    getUnlockedZones,
  ]);

  return (
    <ZoneContext.Provider value={contextValue}>
      {children}
    </ZoneContext.Provider>
  );
};