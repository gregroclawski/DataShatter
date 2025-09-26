import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useZone } from '../contexts/ZoneContext';
import { Zone, ZoneLevel } from '../data/ZoneData';

interface EnemiesZonesOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export const EnemiesZonesOverlay: React.FC<EnemiesZonesOverlayProps> = ({ visible, onClose }) => {
  const { 
    currentZone, 
    currentZoneLevel, 
    availableZones, 
    zoneProgress, 
    selectZone, 
    getZoneProgress,
    isZoneUnlocked 
  } = useZone();
  
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const handleZoneSelect = (zone: Zone) => {
    if (isZoneUnlocked(zone.id)) {
      setSelectedZone(zone);
    }
  };

  const handleLevelSelect = (zone: Zone, level: ZoneLevel, levelIndex: number) => {
    const success = selectZone(zone.id, levelIndex + 1);
    if (success) {
      onClose();
    }
  };

  const renderZoneCard = (zone: Zone) => {
    const progress = getZoneProgress(zone.id);
    const unlocked = isZoneUnlocked(zone.id);
    const isCurrentZone = currentZone?.id === zone.id;
    
    return (
      <TouchableOpacity 
        key={zone.id} 
        style={[
          styles.zoneCard,
          !unlocked && styles.zoneCardLocked,
          isCurrentZone && styles.zoneCardCurrent
        ]}
        onPress={() => handleZoneSelect(zone)}
        disabled={!unlocked}
      >
        <View style={styles.zoneHeader}>
          <Text style={[styles.zoneName, !unlocked && styles.lockedText]}>
            {zone.name}
          </Text>
          <Text style={[styles.zoneTheme, !unlocked && styles.lockedText]}>
            {zone.theme}
          </Text>
          {isCurrentZone && <Ionicons name="location" size={16} color="#10b981" />}
        </View>
        
        <Text style={[styles.zoneDescription, !unlocked && styles.lockedText]}>
          {zone.description}
        </Text>
        
        <View style={styles.zoneStats}>
          <Text style={[styles.statText, !unlocked && styles.lockedText]}>
            Player Level: {zone.minPlayerLevel}-{zone.maxPlayerLevel}
          </Text>
          {progress && (
            <Text style={styles.progressText}>
              Level {progress.currentLevel}/5 • {progress.killsInLevel}/1000 kills
            </Text>
          )}
          {progress?.completed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.completedText}>COMPLETED</Text>
            </View>
          )}
        </View>
        
        {!unlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={20} color="#6b7280" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderZoneDetails = (zone: Zone) => {
    const progress = getZoneProgress(zone.id);
    
    return (
      <View style={styles.zoneDetails}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity onPress={() => setSelectedZone(null)}>
            <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.detailsTitle}>{zone.name}</Text>
        </View>
        
        <ScrollView style={styles.levelsContainer}>
          {zone.levels.map((level, index) => {
            const levelNumber = index + 1;
            const isCurrentLevel = currentZone?.id === zone.id && currentZoneLevel?.level === levelNumber;
            const isUnlocked = !progress || progress.currentLevel >= levelNumber;
            
            return (
              <TouchableOpacity
                key={levelNumber}
                style={[
                  styles.levelCard,
                  !isUnlocked && styles.levelCardLocked,
                  isCurrentLevel && styles.levelCardCurrent
                ]}
                onPress={() => handleLevelSelect(zone, level, index)}
                disabled={!isUnlocked}
              >
                <View style={styles.levelHeader}>
                  <Text style={[styles.levelTitle, !isUnlocked && styles.lockedText]}>
                    Level {levelNumber}
                  </Text>
                  {isCurrentLevel && <Ionicons name="play-circle" size={20} color="#10b981" />}
                  {!isUnlocked && <Ionicons name="lock-closed" size={16} color="#6b7280" />}
                </View>
                
                <View style={styles.levelStats}>
                  <Text style={[styles.statText, !isUnlocked && styles.lockedText]}>
                    Enemy HP: ×{level?.enemyMultiplier || 1} | XP: ×{level?.xpMultiplier || 1}
                  </Text>
                  <Text style={[styles.statText, !isUnlocked && styles.lockedText]}>
                    Enemies: {(level?.enemyTypes || []).join(', ') || 'None'}
                  </Text>
                </View>
                
                {progress && progress.currentLevel === levelNumber && (
                  <View style={styles.progressBar}>
                    <View style={styles.progressBarBg}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${(progress.killsInLevel / 1000) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {progress.killsInLevel}/1000 kills ({Math.floor((progress.killsInLevel / 1000) * 100)}%)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    visible ? (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {selectedZone ? 'Zone Details' : 'Enemies & Zones'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#e5e7eb" />
          </TouchableOpacity>
        </View>
        
        {currentZone && (
          <View style={styles.currentZoneInfo}>
            <Text style={styles.currentZoneText}>
              Currently in: {currentZone.name} - Level {currentZoneLevel?.level}
            </Text>
            <View style={styles.currentProgress}>
              {getZoneProgress(currentZone.id) && (
                <Text style={styles.progressText}>
                  {getZoneProgress(currentZone.id)!.killsInLevel}/1000 kills
                </Text>
              )}
            </View>
          </View>
        )}
        
        <ScrollView style={styles.content}>
          {selectedZone ? renderZoneDetails(selectedZone) : (
            <View style={styles.zonesList}>
              {availableZones.slice(0, 10).map(renderZoneCard)} {/* Show first 10 zones for now */}
            </View>
          )}
        </ScrollView>
      </View>
    ) : null
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
    minHeight: '50%',
    pointerEvents: 'auto', // Ensure overlay content can receive clicks
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  currentZoneInfo: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentZoneText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  currentProgress: {
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  zonesList: {
    gap: 12,
  },
  zoneCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  zoneCardLocked: {
    backgroundColor: '#1f2937',
    opacity: 0.6,
  },
  zoneCardCurrent: {
    borderColor: '#10b981',
    backgroundColor: '#065f46',
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e5e7eb',
    flex: 1,
  },
  zoneTheme: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
  zoneDescription: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 12,
  },
  zoneStats: {
    gap: 4,
  },
  statText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  progressText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  completedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  lockedText: {
    color: '#6b7280',
  },
  zoneDetails: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  levelsContainer: {
    flex: 1,
  },
  levelCard: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  levelCardLocked: {
    backgroundColor: '#1f2937',
    opacity: 0.6,
  },
  levelCardCurrent: {
    borderColor: '#10b981',
    backgroundColor: '#065f46',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  levelStats: {
    gap: 4,
    marginBottom: 8,
  },
  progressBar: {
    gap: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#4b5563',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
});