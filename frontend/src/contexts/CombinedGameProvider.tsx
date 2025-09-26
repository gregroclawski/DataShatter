import React, { ReactNode } from 'react';
import { MaterialsProvider } from './MaterialsContext';
import { EquipmentProvider } from './EquipmentContext';
import { BossProvider } from './BossContext';
import { CombatProvider } from './CombatContext';

interface CombinedGameProviderProps {
  children: ReactNode;
}

/**
 * Combined provider to reduce React Native bridge context nesting depth
 * This addresses mobile-specific "Maximum update depth exceeded" errors
 * by reducing the context provider cascade from 7 levels to 4 levels
 */
export const CombinedGameProvider: React.FC<CombinedGameProviderProps> = ({ children }) => {
  return (
    <MaterialsProvider>
      <EquipmentProvider>
        <BossProvider>
          <CombatProvider>
            {children}
          </CombatProvider>
        </BossProvider>
      </EquipmentProvider>
    </MaterialsProvider>
  );
};