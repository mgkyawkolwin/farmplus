import '../global.css';
import '@/i18n/i18n';

import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { AuthContextProvider } from '@/lib/authContextProvider';
import SnackBar from '@/components/ui/snack-bar';
import  { useColorScheme } from 'nativewind';
import { getStoredColorScheme, storeColorScheme } from '@/lib/colorSchemeStorage';

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadColorScheme() {
      let scheme = await getStoredColorScheme().catch(() => null);
      if (!scheme) {
        scheme = 'light';
        storeColorScheme(scheme);
      }

      if (isActive) {
        setColorScheme(scheme);
        setIsColorSchemeLoaded(true);
      }
    }

    loadColorScheme();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

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