'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { clearTokens } from '@/lib/authStorage';

export default function ProfileScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await clearTokens();
    router.dismissAll();
    router.replace('/auth/signin');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.container}>
      <View className="bg-background border-b-separator" style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Icon className="text-icon" as={ChevronLeft} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
        <Button variant="destructive" style={styles.signOutButton} onPress={handleSignOut}>
          <Text>Sign Out</Text>
        </Button>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  topBarButton: {
    padding: 4,
    width: 32,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 8,
    paddingBottom: 48,
    alignItems: 'flex-start',
  },
  signOutButton: {
    alignSelf: 'flex-start',
  },
});
