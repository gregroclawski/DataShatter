import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../src/contexts/AuthContext';
import { GameProvider } from '../src/contexts/GameContext';
import { CombatProvider } from '../src/contexts/CombatContext';
import { ZoneProvider } from '../src/contexts/ZoneContext';
import { EquipmentProvider } from '../src/contexts/EquipmentContext';
import { MaterialsProvider } from '../src/contexts/MaterialsContext';
import { BossProvider } from '../src/contexts/BossContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen immediately when layout loads
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

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
                </BossProvider>
              </EquipmentProvider>
            </MaterialsProvider>
          </ZoneProvider>
        </GameProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}