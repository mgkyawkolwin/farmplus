'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { clearTokens } from '@/lib/authStorage';
import { useAuthContext } from '@/lib/authContextProvider';
import { normalizeMediaFile } from '@/lib/mediaFile';
import { UserServiceClient } from '@/services/userService';

export default function ProfileScreen() {
  const router = useRouter();
  const { authUser, setAuthUser } = useAuthContext();
  const [isUploading, setIsUploading] = useState(false);

  const userService = useMemo(() => new UserServiceClient(), []);
  const displayName = authUser?.displayName || authUser?.userName || 'User';
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await clearTokens();
    setAuthUser(null);
    router.dismissAll();
    router.replace('/auth/signin');
  };

  const handlePickProfileImage = async (source: 'library' | 'camera') => {
    if (!authUser?.id) {
      return;
    }

    const permissionResult =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== 'granted') {
      return;
    }

    const pickerResult =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });

    if (pickerResult.canceled || !pickerResult.assets?.[0]) {
      return;
    }

    const asset = pickerResult.assets[0];
    const file = normalizeMediaFile({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      assetType: asset.type,
      fallbackName: 'profile-picture',
    });

    try {
      setIsUploading(true);
      const updatedUser = await userService.uploadProfilePicture(authUser.id, file);
      setAuthUser({ ...authUser, ...updatedUser, profilePictureUrl: updatedUser.profilePictureUrl ?? authUser.profilePictureUrl });
    } catch (error) {
      console.error('Profile image upload failed', error);
    } finally {
      setIsUploading(false);
    }
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
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Avatar alt={displayName} style={styles.avatar}>
              {authUser?.profilePictureUrl ? (
                <AvatarImage source={{ uri: authUser.profilePictureUrl }} style={styles.avatarImage} />
              ) : null}
              <AvatarFallback style={styles.avatarFallback}>{initials}</AvatarFallback>
            </Avatar>

            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handlePickProfileImage('library')}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <Text style={styles.photoButtonText}>{isUploading ? '...' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{authUser?.email ?? 'No email provided'}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Button variant="outline" style={styles.actionButton} onPress={() => handlePickProfileImage('library')} disabled={isUploading}>
            <Text>Choose from gallery</Text>
          </Button>
          <Button variant="outline" style={styles.actionButton} onPress={() => handlePickProfileImage('camera')} disabled={isUploading}>
            <Text>Use camera</Text>
          </Button>
        </View>
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
    gap: 16,
    paddingBottom: 48,
  },
  profileHeader: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarFallback: {
    backgroundColor: '#E5E7EB',
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  photoButton: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsRow: {
    width: '100%',
    gap: 10,
  },
  actionButton: {
    width: '100%',
  },
  signOutButton: {
    alignSelf: 'flex-start',
  },
});
