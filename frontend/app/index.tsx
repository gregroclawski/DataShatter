import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';
import AuthScreen from '../src/components/AuthScreen';

export default function NinjaIdleGame() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  
  console.log('🔍 MAIN COMPONENT RENDER:');
  console.log('  - authLoading:', authLoading);
  console.log('  - isAuthenticated:', isAuthenticated);
  
  if (authLoading) {
    console.log('✅ Showing loading screen');
    return <LoadingScreen message="Initializing authentication..." />;
  }

  if (!isAuthenticated) {
    console.log('✅ Showing auth screen');
    return <AuthScreen />;
  }
  
  console.log('✅ User is authenticated - showing simple game component');
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>🎮 Game Loading Success!</Text>
      <Text style={{ color: 'white', fontSize: 16, marginTop: 20 }}>Authentication working correctly</Text>
    </View>
  );
}