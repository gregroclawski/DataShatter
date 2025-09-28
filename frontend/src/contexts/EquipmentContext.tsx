import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  Equipment, 
  EquipmentSlot, 
  EquipmentStats, 
  calculateTotalStats, 
  getUpgradeCost,
  canUpgradeEquipment,
  generateEquipment,
  EquipmentRarity,
  EQUIPMENT_TEMPLATES,
  UpgradeMaterial
} from '../data/EquipmentData';
import { useMaterials } from './MaterialsContext';
import { useGame } from './GameContext';

interface EquipmentInventory {
  equipped: Record<EquipmentSlot, Equipment | null>;
  inventory: Equipment[];
  maxInventorySize: number;
}

interface EquipmentContextType {
  // Equipment State
  inventory: EquipmentInventory;
  totalStats: EquipmentStats;
  
  // Equipment Management
  equipItem: (equipment: Equipment) => boolean;
  unequipItem: (slot: EquipmentSlot) => boolean;
  addToInventory: (equipment: Equipment) => boolean;
  removeFromInventory: (equipmentId: string) => boolean;
  
  // Upgrade System
  upgradeEquipment: (equipmentId: string) => boolean;
  getEquipmentUpgradeCost: (equipmentId: string) => { gold: number; materials: Record<UpgradeMaterial, number> };
  canUpgrade: (equipmentId: string) => boolean;
  
  // Equipment Generation (for testing/boss drops)
  generateRandomEquipment: (templateId?: string, rarity?: EquipmentRarity) => Equipment;
  
  // Utility Functions
  getEquippedItem: (slot: EquipmentSlot) => Equipment | null;
  findEquipmentById: (id: string) => Equipment | null;
  getInventorySpace: () => { used: number; total: number };
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
};

export const EquipmentProvider = ({ children }: { children: ReactNode }) => {
  const { updateNinja, gameState, updateEquipment } = useGame();
  const { hasMaterials, removeMaterial } = useMaterials();
  // Initialize empty equipment state with GameContext integration
  const [inventory, setInventory] = useState<EquipmentInventory>(() => {
    // MOBILE FIX: Initialize with saved equipment data if available
    const savedEquipment = gameState?.equipment;
    if (savedEquipment) {
      console.log('⚔️ Loading saved equipment data:', savedEquipment);
      return {
        equipped: savedEquipment.equipped || {
          [EquipmentSlot.HEAD]: null,
          [EquipmentSlot.BODY]: null,
          [EquipmentSlot.WEAPON]: null,
          [EquipmentSlot.ACCESSORY]: null,
        },
        inventory: savedEquipment.inventory || [],
        maxInventorySize: savedEquipment.maxInventorySize || 50,
      };
    } else {
      console.log('⚔️ No saved equipment data, using defaults');
      return {
        equipped: {
          [EquipmentSlot.HEAD]: null,
          [EquipmentSlot.BODY]: null,
          [EquipmentSlot.WEAPON]: null,
          [EquipmentSlot.ACCESSORY]: null,
        },
        inventory: [],
        maxInventorySize: 50, // Start with 50 inventory slots
      };
    }
  });

  // MOBILE FIX: Helper function to sync equipment changes with GameContext
  const syncEquipmentToGameContext = (newInventory: EquipmentInventory) => {
    console.log('⚔️ Syncing equipment to GameContext for save:', newInventory);
    // Defer the sync to prevent React render-phase violations (similar to zone progression fix)
    setTimeout(() => {
      updateEquipment({
        equipped: newInventory.equipped,
        inventory: newInventory.inventory,
        maxInventorySize: newInventory.maxInventorySize
      });
    }, 0);
  };

  // Calculate total stats from equipped items
  const [totalStats, setTotalStats] = useState<EquipmentStats>({
    attack: 0,
    hp: 0,
    defense: 0,
    critChance: 0,
    cooldownReduction: 0,
  });

  // Recalculate stats whenever equipped items change
  useEffect(() => {
    const newTotalStats = calculateTotalStats(inventory.equipped);
    setTotalStats(newTotalStats);
    console.log('📊 Equipment stats updated:', newTotalStats);
  }, [inventory.equipped]);

  // Equip an item to the appropriate slot
  const equipItem = (equipment: Equipment, fromInventory: boolean = false): boolean => {
    const slot = equipment.slot;
    
    setInventory(prev => {
      const newInventory = { ...prev };
      
      // Check if there's already equipment in that slot
      const currentEquipped = newInventory.equipped[slot];
      
      if (currentEquipped) {
        // Add the currently equipped item to inventory
        newInventory.inventory = [...newInventory.inventory, currentEquipped];
      }
      
      // Equip the new item
      newInventory.equipped[slot] = equipment;
      
      // If the item came from inventory, remove it from there
      if (fromInventory) {
        newInventory.inventory = newInventory.inventory.filter(item => item.id !== equipment.id);
      }
      
      console.log(`⚔️ Equipped ${equipment.name} in ${equipment.slot} slot`);
      
      // MOBILE FIX: Sync equipment changes to GameContext for saving
      syncEquipmentToGameContext(newInventory);
      
      return newInventory;
    });
    
    return true;
  };

  // Unequip an item and move it to inventory
  const unequipItem = (slot: EquipmentSlot): boolean => {
    setInventory(prev => {
      const currentEquipped = prev.equipped[slot];
      if (!currentEquipped) {
        return prev; // Nothing to unequip
      }
      
      // Check inventory space
      if (prev.inventory.length >= prev.maxInventorySize) {
        console.log('❌ Cannot unequip: inventory full');
        return prev;
      }
      
      const newInventory = { ...prev };
      newInventory.equipped[slot] = null;
      newInventory.inventory.push(currentEquipped);
      
      console.log(`📦 Unequipped ${currentEquipped.name} from ${slot} slot`);
      return newInventory;
    });
    
    return true;
  };

  // Add equipment to inventory (from drops)
  const addToInventory = (equipment: Equipment): boolean => {
    if (inventory.inventory.length >= inventory.maxInventorySize) {
      console.log('❌ Cannot add equipment: inventory full');
      return false;
    }
    
    setInventory(prev => ({
      ...prev,
      inventory: [...prev.inventory, equipment]
    }));
    
    console.log(`📦 Added ${equipment.name} to inventory`);
    return true;
  };

  // Remove equipment from inventory (sell/delete)
  const removeFromInventory = (equipmentId: string): boolean => {
    setInventory(prev => ({
      ...prev,
      inventory: prev.inventory.filter(item => item.id !== equipmentId)
    }));
    
    console.log(`🗑️ Removed equipment ${equipmentId} from inventory`);
    return true;
  };

  // Upgrade equipment (requires gold and materials)
  const upgradeEquipment = (equipmentId: string): boolean => {
    // Find the equipment (could be equipped or in inventory)
    const equipment = findEquipmentById(equipmentId);
    if (!equipment || !canUpgradeEquipment(equipment)) {
      console.log('❌ Cannot upgrade equipment - not found or max level');
      return false;
    }
    
    // Get upgrade costs
    const upgradeCosts = getUpgradeCost(equipment);
    
    // Check if player has enough materials
    if (!hasMaterials(upgradeCosts.materials)) {
      console.log('❌ Cannot upgrade equipment - insufficient materials');
      return false;
    }
    
    // Note: Check gold via GameContext in a full implementation
    // For now, we'll assume the upgrade is allowed if materials are available
    
    // Consume materials
    Object.entries(upgradeCosts.materials).forEach(([material, quantity]) => {
      if (quantity > 0) {
        removeMaterial(material as UpgradeMaterial, quantity);
      }
    });
    
    // Consume gold (via GameContext)
    updateNinja((prev) => ({
      gold: Math.max(0, prev.gold - upgradeCosts.gold)
    }));
    
    setInventory(prev => {
      const newInventory = { ...prev };
      
      // Update equipped items
      Object.keys(newInventory.equipped).forEach(slot => {
        const item = newInventory.equipped[slot as EquipmentSlot];
        if (item && item.id === equipmentId) {
          newInventory.equipped[slot as EquipmentSlot] = upgradeEquipmentStats(item);
        }
      });
      
      // Update inventory items
      newInventory.inventory = newInventory.inventory.map(item => 
        item.id === equipmentId ? upgradeEquipmentStats(item) : item
      );
      
      return newInventory;
    });
    
    console.log(`⬆️ Upgraded ${equipment.name} to level ${equipment.level + 1}`);
    return true;
  };

  // Helper function to upgrade equipment stats
  const upgradeEquipmentStats = (equipment: Equipment): Equipment => {
    const newLevel = equipment.level + 1;
    const rarityConfig = {
      common: 1.1, uncommon: 1.15, rare: 1.2, epic: 1.3, legendary: 1.5
    };
    
    const multiplier = rarityConfig[equipment.rarity] || 1.1;
    const newStats: EquipmentStats = {};
    
    Object.entries(equipment.currentStats).forEach(([key, value]) => {
      if (typeof value === 'number') {
        newStats[key as keyof EquipmentStats] = Math.floor(value * multiplier);
      }
    });
    
    return {
      ...equipment,
      level: newLevel,
      currentStats: newStats
    };
  };

  // Get upgrade cost for equipment
  const getEquipmentUpgradeCost = (equipmentId: string): { gold: number; materials: Record<UpgradeMaterial, number> } => {
    const equipment = findEquipmentById(equipmentId);
    return equipment ? getUpgradeCost(equipment) : { 
      gold: 0, 
      materials: {
        [UpgradeMaterial.FIRE_ESSENCE]: 0,
        [UpgradeMaterial.ICE_CRYSTAL]: 0,
        [UpgradeMaterial.SHADOW_ORB]: 0,
        [UpgradeMaterial.EARTH_FRAGMENT]: 0,
        [UpgradeMaterial.MYSTIC_DUST]: 0,
      }
    };
  };

  // Check if equipment can be upgraded
  const canUpgrade = (equipmentId: string): boolean => {
    const equipment = findEquipmentById(equipmentId);
    return equipment ? canUpgradeEquipment(equipment) : false;
  };

  // Generate random equipment (for testing/boss drops)
  const generateRandomEquipment = (templateId?: string, rarity?: EquipmentRarity): Equipment => {
    const templateIds = Object.keys(EQUIPMENT_TEMPLATES);
    const selectedTemplate = templateId || templateIds[Math.floor(Math.random() * templateIds.length)];
    
    const rarities = Object.values(EquipmentRarity);
    const selectedRarity = rarity || rarities[Math.floor(Math.random() * rarities.length)];
    
    return generateEquipment(selectedTemplate, selectedRarity);
  };

  // Get equipped item by slot
  const getEquippedItem = (slot: EquipmentSlot): Equipment | null => {
    return inventory.equipped[slot];
  };

  // Find equipment by ID (in equipped items or inventory)
  const findEquipmentById = (id: string): Equipment | null => {
    // Check equipped items
    for (const slot of Object.values(EquipmentSlot)) {
      const item = inventory.equipped[slot];
      if (item && item.id === id) {
        return item;
      }
    }
    
    // Check inventory
    return inventory.inventory.find(item => item.id === id) || null;
  };

  // Get inventory space information
  const getInventorySpace = () => ({
    used: inventory.inventory.length,
    total: inventory.maxInventorySize
  });

  const contextValue: EquipmentContextType = React.useMemo(() => ({
    inventory,
    totalStats,
    equipItem,
    unequipItem,
    addToInventory,
    removeFromInventory,
    upgradeEquipment,
    getEquipmentUpgradeCost,
    canUpgrade,
    generateRandomEquipment,
    getEquippedItem,
    findEquipmentById,
    getInventorySpace,
  }), [
    inventory,
    totalStats,
    equipItem,
    unequipItem,
    addToInventory,
    removeFromInventory,
    upgradeEquipment,
    getEquipmentUpgradeCost,
    canUpgrade,
    generateRandomEquipment,
    getEquippedItem,
    findEquipmentById,
    getInventorySpace,
  ]);

  return (
    <EquipmentContext.Provider value={contextValue}>
      {children}
    </EquipmentContext.Provider>
  );
};