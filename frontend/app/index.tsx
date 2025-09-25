import React from 'react';
import { View, Text } from 'react-native';

export default function NinjaIdleGame() {
  console.log('🔍 SIMPLE COMPONENT RENDERED!');
  
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Simple Test Component</Text>
    </View>
  );
}