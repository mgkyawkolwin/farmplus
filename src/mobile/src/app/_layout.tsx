import '@/global.css';

import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';



export default function RootLayout() {
  return (
    <View className={`flex-1 light`}>
      <Slot />
      <PortalHost />
    </View>
  );
}
