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
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { IAuthService } from '../../services/authService';

const authService = container.resolve<IAuthService>(DI_TOKENS.IAuthService);

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!userName.trim() || !password || !confirmedPassword) {
      SnackBar.Error('Complete all required fields.');
      return;
    }

    if (password !== confirmedPassword) {
      SnackBar.Error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register(userName.trim(), userName.trim(), password);
      SnackBar.Success('Account created. Sign in with your new credentials.');
      router.replace('/auth/signin');
    } catch (error) {
      SnackBar.Error(error instanceof CustomError ? error.message : 'Unable to create your account. Please try again.');
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
          <Text style={styles.eyebrow}>GET STARTED</Text>
          <Text variant="h2" style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Set up your secure Farm Plus workspace access.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Label>Username <Text style={styles.required}>*</Text></Label>
            <Input
              placeholder="Choose a username"
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
            <Label>Password <Text style={styles.required}>*</Text></Label>
            <Input
              placeholder="Create a password"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Label>Confirm password <Text style={styles.required}>*</Text></Label>
            <Input
              placeholder="Re-enter your password"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              value={confirmedPassword}
              onChangeText={setConfirmedPassword}
              onSubmitEditing={handleRegister}
              returnKeyType="done"
              style={styles.input}
            />
          </View>

          <Button style={styles.primaryButton} onPress={handleRegister} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Creating account…' : 'Create Account'}</Text>
          </Button>
        </View>

        <Button
          variant="link"
          style={styles.signInButton}
          onPress={() => router.replace('/auth/signin')}
        >
          <Text style={styles.signInButtonText}>Already have an account? Sign in</Text>
        </Button>

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
  required: {
    color: '#B42318',
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
  signInButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  signInButtonText: {
    color: '#176B45',
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
    borderTopColor: '#EDF1EE',
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
