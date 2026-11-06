'use client';

import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Settings, ShieldCheck } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import CustomError from '@/lib/customError';
import { useAuthContext } from '@/lib/authContextProvider';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { IAuthService } from '../../services/authService';
import { THEME } from '@/lib/theme';

const authService = container.resolve<IAuthService>(DI_TOKENS.IAuthService);

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const { setAuthUser } = useAuthContext();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!userName.trim() || !password) {
      SnackBar.Error(t('auth.signIn.messages.enterCredentials'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.signIn(userName.trim(), password);
      // API returns { token, user: { id, userName, ... } }; persist the user so authUser.id is available.
      if (response.data?.user) {
        setAuthUser(response.data.user);
      }
      router.replace('/home/dashboard');
    } catch (error) {
      SnackBar.Error(error instanceof CustomError ? error.message : t('auth.signIn.messages.signInFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar />
      <ScrollView
        contentContainerStyle={[styles.page, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: theme.primary }]}>
            <Image source={require('@/assets/images/Farmplus shop.png')} style={styles.brandLogo} />
          </View>
          <Text style={[styles.brandName, { color: theme.foreground }]}>FARM PLUS</Text>
          <Text style={[styles.brandCaption, { color: theme.mutedForeground }]}>{t('auth.brandCaption')}</Text>
        </View>

        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('auth.signIn.eyebrow')}</Text>
          <Text variant="h2" style={[styles.title, { color: theme.foreground }]}>{t('auth.signIn.title')}</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>{t('auth.signIn.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Label>{t('auth.signIn.username')}</Label>
            <Input
              placeholder={t('auth.signIn.usernamePlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
              value={userName}
              onChangeText={setUserName}
              returnKeyType="next"
              style={[styles.input, { borderColor: theme.input, backgroundColor: theme.card, color: theme.foreground }]}
            />
          </View>

          <View style={styles.field}>
            <Label>{t('auth.signIn.password')}</Label>
            <Input
              placeholder={t('auth.signIn.passwordPlaceholder')}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSignIn}
              returnKeyType="done"
              style={[styles.input, { borderColor: theme.input, backgroundColor: theme.card, color: theme.foreground }]}
            />
          </View>

          <Button style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleSignIn} disabled={isSubmitting}>
            <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>{isSubmitting ? t('auth.signIn.signingIn') : t('auth.signIn.signIn')}</Text>
          </Button>
        </View>

        <View style={[styles.registerPrompt, { borderTopColor: theme.border }]}>
          <Text style={[styles.promptText, { color: theme.mutedForeground }]}>{t('auth.signIn.newToFarmPlus')}</Text>
          <Button
            variant="outline"
            style={[styles.registerButton, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => router.push('./register')}
          >
            <Text style={[styles.registerButtonText, { color: theme.primary }]}>{t('auth.signIn.createAccount')}</Text>
          </Button>
        </View>

        <View style={styles.securityNote}>
          <Icon as={ShieldCheck} size={16} color={theme.mutedForeground} />
          <Text style={[styles.securityText, { color: theme.mutedForeground }]}>{t('auth.securityNote')}</Text>
        </View>
      <Text style={[styles.footer, { color: theme.mutedForeground }]}>{t('auth.footer')}</Text>
      </ScrollView>
      <Button
        variant="ghost"
        accessibilityLabel={t('title.settings')}
        onPress={() => router.push('../settings')}
        style={[styles.settingsButton, { top: insets.top + 8, backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Icon as={Settings} size={20} color={theme.foreground} />
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  settingsButton: { position: 'absolute', right: 12, zIndex: 1, width: 40, height: 40, padding: 0, borderWidth: 1, borderRadius: 8 },
  brand: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: 36,
    height: 36,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandCaption: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  heading: {
    gap: 8,
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  input: {
    height: 48,
    borderRadius: 10,
  },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  registerPrompt: {
    alignItems: 'center',
    gap: 12,
    marginTop: 26,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  promptText: {
    fontSize: 14,
  },
  registerButton: {
    width: '100%',
    height: 46,
    borderRadius: 10,
  },
  registerButtonText: {
    fontWeight: '700',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 24,
  },
  securityText: {
    fontSize: 12,
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
  },
});
