import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ZONES, ENEMY_TYPES, calculateEnemyStats, getZoneByLevel, isZoneUnlocked, Zone, ZoneLevel } from '../data/ZoneData';
import { useGame } from './GameContext';

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
  currentZone: Zone | null;
  currentZoneLevel: ZoneLevel | null;
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
  
  // Zone State
  const [currentZone, setCurrentZone] = useState<Zone | null>(ZONES[0]);
  const [currentZoneLevel, setCurrentZoneLevel] = useState<ZoneLevel | null>(ZONES[0]?.levels[0] || null);
  const [zoneProgress, setZoneProgress] = useState<Record<number, ZoneProgress>>({
    1: { zoneId: 1, currentLevel: 1, killsInLevel: 0, completed: false }
  });

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

  // Select a zone and level for farming
  const selectZone = (zoneId: number, levelNumber: number): boolean => {
    const zone = ZONES.find(z => z.id === zoneId);
    if (!zone || !isZoneUnlocked(zoneId, zoneProgress)) {
      console.log(`❌ Zone ${zoneId} not found or locked`);
      return false;
    }
    
    const level = zone.levels[levelNumber - 1];
    if (!level) {
      console.log(`❌ Level ${levelNumber} not found in zone ${zoneId}`);
      return false;
    }
    
    setCurrentZone(zone);
    setCurrentZoneLevel(level);
    console.log(`🗺️ Selected ${zone.name} - Level ${levelNumber}`);
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
      progress.killsInLevel += 1;
      
      console.log(`📊 Zone ${zoneId} Level ${progress.currentLevel}: ${progress.killsInLevel}/1000 kills`);
      
      // Check if level completed
      if (progress.killsInLevel >= 1000) {
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
      
      // MOBILE FIX: Update GameContext with zone progress to save to server
      console.log(`💾 Updating GameContext with zone progress:`, newProgress);
      updateZoneProgress(newProgress);
      
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
    currentZone,
    currentZoneLevel,
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