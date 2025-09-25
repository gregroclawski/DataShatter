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
      <AuthProvider>
        <GameProvider>
          <ZoneProvider>
            <MaterialsProvider>
              <EquipmentProvider>
                <BossProvider>
                  <CombatProvider>
                    <StatusBar style="light" backgroundColor="#0f172a" />
                    <Stack
                      screenOptions={{
                        headerStyle: {
                          backgroundColor: '#1e293b',
                        },
                        headerTintColor: '#f8fafc',
                        headerTitleStyle: {
                          fontWeight: 'bold',
                        },
                        contentStyle: {
                          backgroundColor: '#0f172a',
                        },
                      }}
                    >
                      <Stack.Screen 
                        name="index" 
                        options={{ 
                          title: 'Ninja Master',
                          headerShown: false,
                        }} 
                      />
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