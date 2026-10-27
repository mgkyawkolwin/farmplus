'use client';

import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, ShieldCheck } from 'lucide-react-native';

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

const authService = container.resolve<IAuthService>(DI_TOKENS.IAuthService);

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { setAuthUser } = useAuthContext();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!userName.trim() || !password) {
      SnackBar.Error('Enter your username and password.');
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
      SnackBar.Error(error instanceof CustomError ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.card}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Icon as={Leaf} size={23} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>FARM PLUS</Text>
          <Text style={styles.brandCaption}>BUSINESS MANAGEMENT</Text>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text variant="h2" style={styles.title}>Sign in to your workspace</Text>
          <Text style={styles.subtitle}>Manage your operations with a single secure account.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Label>Username</Label>
            <Input
              placeholder="Enter your username"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
              value={userName}
              onChangeText={setUserName}
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Label>Password</Label>
            <Input
              placeholder="Enter your password"
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSignIn}
              returnKeyType="done"
              style={styles.input}
            />
          </View>

          <Button style={styles.primaryButton} onPress={handleSignIn} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Signing in…' : 'Sign In'}</Text>
          </Button>
        </View>

        <View style={styles.registerPrompt}>
          <Text style={styles.promptText}>New to Farm Plus?</Text>
          <Button
            variant="outline"
            style={styles.registerButton}
            onPress={() => router.push('./register')}
          >
            <Text style={styles.registerButtonText}>Create an account</Text>
          </Button>
        </View>

        <View style={styles.securityNote}>
          <Icon as={ShieldCheck} size={16} color="#64748B" />
          <Text style={styles.securityText}>Your account is protected with secure sign-in.</Text>
        </View>
      </View>
      <Text style={styles.footer}>Farm Plus · Business tools for growing businesses</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: '#F4F7F5',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    paddingHorizontal: 32,
    paddingVertical: 36,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    shadowColor: '#163B2B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
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
    backgroundColor: '#176B45',
    marginBottom: 12,
  },
  brandName: {
    color: '#173B2B',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandCaption: {
    color: '#738078',
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
    color: '#176B45',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#172B21',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    color: '#65736A',
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
    borderColor: '#D8E1DB',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#176B45',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  registerPrompt: {
    alignItems: 'center',
    gap: 12,
    marginTop: 26,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#EDF1EE',
  },
  promptText: {
    color: '#65736A',
    fontSize: 14,
  },
  registerButton: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    borderColor: '#B9C9BE',
  },
  registerButtonText: {
    color: '#176B45',
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
    color: '#738078',
    fontSize: 12,
  },
  footer: {
    marginTop: 24,
    color: '#7C8981',
    textAlign: 'center',
    fontSize: 12,
  },
});
