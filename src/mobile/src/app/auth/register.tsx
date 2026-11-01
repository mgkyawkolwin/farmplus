'use client';

import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Leaf, ShieldCheck } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import CustomError from '@/lib/customError';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { IAuthService } from '../../services/authService';
import { THEME } from '@/lib/theme';

const authService = container.resolve<IAuthService>(DI_TOKENS.IAuthService);

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!userName.trim() || !password || !confirmedPassword) {
      SnackBar.Error(t('auth.register.messages.completeFields'));
      return;
    }

    if (password !== confirmedPassword) {
      SnackBar.Error(t('auth.register.messages.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register(userName.trim(), userName.trim(), password);
      SnackBar.Success(t('auth.register.messages.accountCreated'));
      router.replace('/auth/signin');
    } catch (error) {
      SnackBar.Error(error instanceof CustomError ? error.message : t('auth.register.messages.createFailed'));
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
            <Icon as={Leaf} size={23} color={theme.primaryForeground} />
          </View>
          <Text style={[styles.brandName, { color: theme.foreground }]}>FARM PLUS</Text>
          <Text style={[styles.brandCaption, { color: theme.mutedForeground }]}>{t('auth.brandCaption')}</Text>
        </View>

        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('auth.register.eyebrow')}</Text>
          <Text variant="h2" style={[styles.title, { color: theme.foreground }]}>{t('auth.register.title')}</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>{t('auth.register.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Label>{t('auth.register.username')} <Text style={{ color: theme.destructive }}>*</Text></Label>
            <Input
              placeholder={t('auth.register.usernamePlaceholder')}
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
            <Label>{t('auth.register.password')} <Text style={{ color: theme.destructive }}>*</Text></Label>
            <Input
              placeholder={t('auth.register.passwordPlaceholder')}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              style={[styles.input, { borderColor: theme.input, backgroundColor: theme.card, color: theme.foreground }]}
            />
          </View>

          <View style={styles.field}>
            <Label>{t('auth.register.confirmPassword')} <Text style={{ color: theme.destructive }}>*</Text></Label>
            <Input
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              value={confirmedPassword}
              onChangeText={setConfirmedPassword}
              onSubmitEditing={handleRegister}
              returnKeyType="done"
              style={[styles.input, { borderColor: theme.input, backgroundColor: theme.card, color: theme.foreground }]}
            />
          </View>

          <Button style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleRegister} disabled={isSubmitting}>
            <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>{isSubmitting ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}</Text>
          </Button>
        </View>

        <Button
          variant="link"
          style={styles.signInButton}
          onPress={() => router.replace('/auth/signin')}
        >
          <Text style={[styles.signInButtonText, { color: theme.primary }]}>{t('auth.register.alreadyHaveAccount')}</Text>
        </Button>

        <View style={[styles.securityNote, { borderTopColor: theme.border }]}>
          <Icon as={ShieldCheck} size={16} color={theme.mutedForeground} />
          <Text style={[styles.securityText, { color: theme.mutedForeground }]}>{t('auth.securityNote')}</Text>
        </View>
        <Text style={[styles.footer, { color: theme.mutedForeground }]}>{t('auth.footer')}</Text>
      </ScrollView>
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
  signInButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
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
