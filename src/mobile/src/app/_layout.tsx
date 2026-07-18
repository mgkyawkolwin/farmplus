import '@/global.css';
import '@/i18n/i18n';

import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { AuthContextProvider } from '@/auth/authContextProvider';



export default function RootLayout() {
  return (
    <AuthContextProvider>
        <View className={`flex-1 light`}>
          <Slot />
          <PortalHost />
        </View>
    </AuthContextProvider>
  );
}
