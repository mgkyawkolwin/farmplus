import '@/global.css';
import '@/i18n/i18n';

import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, useColorScheme, View } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { AuthContextProvider } from '@/lib/authContextProvider';
import SnackBar from '@/components/ui/snack-bar';



export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <AuthContextProvider>
      <StatusBar className='bg-background' barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <SnackBar />
        <View className={`flex-1 light`}>
          <Slot />
          <PortalHost />
        </View>
    </AuthContextProvider>
  );
}
