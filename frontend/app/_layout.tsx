import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from '../src/contexts/GameContext';
import { CombatProvider } from '../src/contexts/CombatContext';
import { ZoneProvider } from '../src/contexts/ZoneContext';
import { EquipmentProvider } from '../src/contexts/EquipmentContext';
import { MaterialsProvider } from '../src/contexts/MaterialsContext';
import { BossProvider } from '../src/contexts/BossContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <ZoneProvider>
          <MaterialsProvider>
            <EquipmentProvider>
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
          <Stack.Screen 
            name="game" 
            options={{ 
              title: 'Battle Arena',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="shurikens" 
            options={{ 
              title: 'Shurikens',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="pets" 
            options={{ 
              title: 'Pets',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="training" 
            options={{ 
              title: 'Training',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="raids" 
            options={{ 
              title: 'Raids',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="adventure" 
            options={{ 
              title: 'Adventure',
              headerShown: false,
            }} 
          />
        </Stack>
              </CombatProvider>
            </EquipmentProvider>
          </MaterialsProvider>
        </ZoneProvider>
      </GameProvider>
    </SafeAreaProvider>
  );
}