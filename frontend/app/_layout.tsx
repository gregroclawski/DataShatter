import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { GameProvider } from '../src/contexts/GameContext';
import { CombatProvider } from '../src/contexts/CombatContext';
import { ZoneProvider } from '../src/contexts/ZoneContext';
import { EquipmentProvider } from '../src/contexts/EquipmentContext';
import { MaterialsProvider } from '../src/contexts/MaterialsContext';
import { BossProvider } from '../src/contexts/BossContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0a0a0f" />
      <AuthProvider>
        <GameProvider>
          <ZoneProvider>
            <MaterialsProvider>
              <EquipmentProvider>
                <BossProvider>
                  <CombatProvider>
                    <Slot />
                  </CombatProvider>
                </BossProvider>
              </EquipmentProvider>
            </MaterialsProvider>
          </ZoneProvider>
        </GameProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}