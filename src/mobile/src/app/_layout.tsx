import '../global.css';
import '@/i18n/i18n';

import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { AuthContextProvider } from '@/lib/authContextProvider';
import SnackBar from '@/components/ui/snack-bar';
import  { useColorScheme } from 'nativewind';

export default function RootLayout() {
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

  return (
    <AuthContextProvider>
      <SnackBar />
      <View className={`flex-1 ${colorScheme === 'dark' ? 'dark' : ''}`}>
        <Stack screenOptions={{ 
          headerShown: false, 
          statusBarAnimation: 'fade',
          statusBarHidden: false,
          statusBarStyle: colorScheme === 'dark' ? 'light' : 'dark',
          }} >
          {/* Main Tab flow */}
          <Stack.Screen name="home" options={{ headerShown: false }} />
          
          {/* Sub-screens pushed over tabs will automatically slide in here */}
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <PortalHost />
      </View>
    </AuthContextProvider>
  );
}