'use client';

import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Settings } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function AuthScreen() {
  const router = useRouter();

  return (
    <View className='bg-background' style={[ styles.container, {  }]}>
      <View>
        <Icon className="text-foreground" as={Settings} size={24} onPress={() => router.push('../settings')} />
      </View>
      <View style={styles.topSection}>
        <View style={styles.avatarPlaceholder} />
      </View>

      <View className='bg-background' style={styles.centerSection}>
        <Text variant={'h1'} style={styles.title}>
          Welcome to Farm + POS
        </Text>
        <Text style={styles.subtitle}>
          Manage your shop, sales, inventories and customer at one place
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <Button style={styles.button} onPress={() => router.push('./signin')}>
          <Text>Login</Text>
        </Button>
        <Button style={styles.button} onPress={() => router.push('../home')}>
          <Text>Connect with Greenway</Text>
        </Button>
        <Button variant="secondary" style={styles.button} onPress={() => router.push('../accounts/create')}>
          <Text>Create New Account</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 86,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    color: '#6B7280',
  },
  bottomSection: {
    gap: 16,
  },
  button: {
    width: '100%',
  },
});
