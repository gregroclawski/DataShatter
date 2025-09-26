import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/contexts/AuthContext';
import { GameProvider } from '../src/contexts/GameContext';
import { ZoneProvider } from '../src/contexts/ZoneContext';
import { CombatProvider } from '../src/contexts/CombatContext';
import { CombinedGameProvider } from '../src/contexts/CombinedGameProvider';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0a0a0f" />
        <AuthProvider>
          <GameProvider>
            <ZoneProvider>
              <CombatProvider>
                <CombinedGameProvider>
                  <Slot />
                </CombinedGameProvider>
              </CombatProvider>
            </ZoneProvider>
          </GameProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}