'use client';

import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon } from '@/components/ui/icon';
import CustomError from '@/lib/customError';
import SnackBar from '@/components/ui/snack-bar';
import { AuthServiceClient, IAuthService } from '../../services/authService';
import { useState } from 'react';
import { container, DI_TOKENS } from '@/di';
import { storeToken } from '@/lib/authStorage';


const authService = container.resolve<IAuthService>(DI_TOKENS.IAuthService);

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    try{
        const response = await authService.signIn(userName, password);
        router.replace('/home/dashboard');
    }catch(error){
        SnackBar.Error(error instanceof CustomError ? error.message : "Unknown error occured. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-background" style={styles.page}>
      <StatusBar className='bg-background' barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View className="bg-background border-border" style={[styles.headerBar]}> 
        <Button variant="ghost">
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
            <Text className="text-foreground" style={styles.backButtonText}>
              Back
            </Text>
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h2" style={styles.header}>
          Welcome Back!
        </Text>
        <Text style={styles.subtitle}>
          Sign in to your account
        </Text>

        <View style={styles.field}>
          <Label>Email</Label>
          <Input placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none"
          value={userName} onChangeText={text => setUserName(text)} />
        </View>

        <View style={styles.field}>
          <Label>Password</Label>
          <Input placeholder="Enter your password" secureTextEntry
          value={password} onChangeText={text => setPassword(text)} />
        </View>

        <Button style={styles.continueButton} onPress={() => handleSignIn()}>
          <Text>Sign In</Text>
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    minWidth: 80,
  },
  titleBarTitle: {
    textAlign: 'center',
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    marginBottom: 24,
    color: '#6B7280',
    fontSize: 16,
    lineHeight: 24,
  },
  field: {
    gap: 8,
  },
  continueButton: {
    marginTop: 20,
    width: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 22,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: '500',
  },
});
