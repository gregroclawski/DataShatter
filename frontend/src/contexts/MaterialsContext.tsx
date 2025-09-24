import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  UpgradeMaterial, 
  UpgradeMaterialData, 
  UPGRADE_MATERIALS 
} from '../data/EquipmentData';

interface MaterialsInventory {
  materials: Record<UpgradeMaterial, number>;
}

interface MaterialsContextType {
  // Materials State
  materialsInventory: MaterialsInventory;
  
  // Materials Management
  addMaterial: (material: UpgradeMaterial, quantity: number) => void;
  removeMaterial: (material: UpgradeMaterial, quantity: number) => boolean;
  getMaterialCount: (material: UpgradeMaterial) => number;
  hasMaterials: (required: Record<UpgradeMaterial, number>) => boolean;
  
  // Utility Functions
  getAllMaterials: () => UpgradeMaterialData[];
  getMaterialData: (material: UpgradeMaterial) => UpgradeMaterialData;
}

const MaterialsContext = createContext<MaterialsContextType | undefined>(undefined);

export const useMaterials = () => {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialsProvider');
  }
  return context;
};

export const MaterialsProvider = ({ children }: { children: ReactNode }) => {
  // Initialize materials inventory - all start at 0
  const [materialsInventory, setMaterialsInventory] = useState<MaterialsInventory>({
    materials: {
      [UpgradeMaterial.FIRE_ESSENCE]: 0,
      [UpgradeMaterial.ICE_CRYSTAL]: 0,
      [UpgradeMaterial.SHADOW_ORB]: 0,
      [UpgradeMaterial.EARTH_FRAGMENT]: 0,
      [UpgradeMaterial.MYSTIC_DUST]: 0,
    }
  });

  // Add materials to inventory (from boss drops)
  const addMaterial = (material: UpgradeMaterial, quantity: number): void => {
    setMaterialsInventory(prev => ({
      ...prev,
      materials: {
        ...prev.materials,
        [material]: prev.materials[material] + quantity
      }
    }));
    
    const materialData = UPGRADE_MATERIALS[material];
    console.log(`📦 Added ${quantity}x ${materialData.name} to materials inventory`);
  };

  // Remove materials from inventory (for upgrades)
  const removeMaterial = (material: UpgradeMaterial, quantity: number): boolean => {
    if (materialsInventory.materials[material] < quantity) {
      console.log(`❌ Not enough ${UPGRADE_MATERIALS[material].name}`);
      return false;
    }
    
    setMaterialsInventory(prev => ({
      ...prev,
      materials: {
        ...prev.materials,
        [material]: prev.materials[material] - quantity
      }
    }));
    
    const materialData = UPGRADE_MATERIALS[material];
    console.log(`🔧 Used ${quantity}x ${materialData.name} for upgrade`);
    return true;
  };

  // Get count of specific material
  const getMaterialCount = (material: UpgradeMaterial): number => {
    return materialsInventory.materials[material];
  };

  // Check if player has required materials
  const hasMaterials = (required: Record<UpgradeMaterial, number>): boolean => {
    return Object.entries(required).every(([material, requiredCount]) => {
      if (requiredCount === 0) return true;
      return materialsInventory.materials[material as UpgradeMaterial] >= requiredCount;
    });
  };

  // Get all materials data
  const getAllMaterials = (): UpgradeMaterialData[] => {
    return Object.values(UPGRADE_MATERIALS);
  };

  // Get specific material data
  const getMaterialData = (material: UpgradeMaterial): UpgradeMaterialData => {
    return UPGRADE_MATERIALS[material];
  };

  const contextValue: MaterialsContextType = {
    materialsInventory,
    addMaterial,
    removeMaterial,
    getMaterialCount,
    hasMaterials,
    getAllMaterials,
    getMaterialData,
  };

  return (
    <MaterialsContext.Provider value={contextValue}>
      {children}
    </MaterialsContext.Provider>
  );
};