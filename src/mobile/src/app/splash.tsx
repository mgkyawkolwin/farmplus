'use client';

import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/text';
import { hasStoredSession } from '@/lib/authStorage';

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(async () => {
      const hasSession = await hasStoredSession().catch(() => false);
      if (!isActive) {
        return;
      }
      router.replace(hasSession ? '/home/dashboard' : '/auth/signin');
    }, 3000);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={require('@/assets/images/expo-logo.png')} style={styles.logo} />
        <Text style={styles.title}>
          {t('splash.title')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
  },
});
