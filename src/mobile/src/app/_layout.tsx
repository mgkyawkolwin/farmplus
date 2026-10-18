import '../global.css';
import '@/i18n/i18n';

import { Stack, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';
import { AuthContextProvider } from '@/lib/authContextProvider';
import SnackBar from '@/components/ui/snack-bar';
import  { useColorScheme } from 'nativewind';
import { RolePermissionServiceClient, type CurrentPermissions } from '@/services/rolePermissionService';

const permissionService = new RolePermissionServiceClient();
const UNRESTRICTED_PATHS = new Set(['/menu', '/profile', '/settings', '/home/dashboard', '/home/sales', '/sales/dashboard', '/home/purchases', '/purchases/dashboard']);
const SCREEN_PERMISSION_PATHS = new Set(['/brands/brands']);

function PermissionRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const permissionRequest = useRef<Promise<CurrentPermissions> | null>(null);
  const permissionsRef = useRef<CurrentPermissions | null>(null);

  useEffect(() => {
    const isPublicPath = !pathname || pathname === '/' || pathname === '/index' || pathname === '/splash' ||
      pathname.startsWith('/auth/') || pathname.startsWith('/accounts/');
    if (isPublicPath || UNRESTRICTED_PATHS.has(pathname) || SCREEN_PERMISSION_PATHS.has(pathname)) {
      if (pathname.startsWith('/auth/') || pathname.startsWith('/accounts/')) {
        permissionRequest.current = null;
        permissionsRef.current = null;
      }
      return;
    }

    if (permissionsRef.current) {
      if (!permissionsRef.current.isExempt && !permissionsRef.current.permissionKeys.includes(pathname)) {
        routerRef.current.replace('/menu');
      }
      return;
    }

    let active = true;
    permissionRequest.current ??= permissionService.getCurrentPermissions();
    permissionRequest.current.then((result) => {
      if (!active) return;
      permissionsRef.current = result;
      if (!result.isExempt && !result.permissionKeys.includes(pathname)) {
        routerRef.current.replace('/menu');
      }
    }).catch(() => {
      if (active) routerRef.current.replace('/menu');
    });

    return () => { active = false; };
  }, [pathname]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

  return (
    <AuthContextProvider>
      <SnackBar />
      <View className='flex-1'>
        <PermissionRouteGuard>
        <Stack screenOptions={{ 
          headerShown: false, 
          statusBarAnimation: 'fade',
          statusBarHidden: false,
          statusBarStyle: colorScheme === 'dark' ? 'dark' : 'light',
          }} >
          {/* Main Tab flow */}
          <Stack.Screen name="home" options={{ headerShown: false }} />
          
          {/* Sub-screens pushed over tabs will automatically slide in here */}
        </Stack>
        </PermissionRouteGuard>
        <PortalHost />
      </View>
    </AuthContextProvider>
  );
}