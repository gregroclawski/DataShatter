import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { GameProvider } from '../src/contexts/GameContext';
import { CombatProvider } from '../src/contexts/CombatContext';
import { ZoneProvider } from '../src/contexts/ZoneContext';
import { EquipmentProvider } from '../src/contexts/EquipmentContext';
import { MaterialsProvider } from '../src/contexts/MaterialsContext';
import { BossProvider } from '../src/contexts/BossContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0f172a" />
      <AuthProvider>
        <GameProvider>
          <ZoneProvider>
            <MaterialsProvider>
              <EquipmentProvider>
                <BossProvider>
                  <CombatProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: {
                          backgroundColor: '#0f172a',
                        },
                      }}
                    >
                      <Stack.Screen name="index" />
                    </Stack>
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