'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, type TextInputProps } from 'react-native';
import { ChevronLeft, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import SnackBar from '@/components/ui/snack-bar';
import { Text } from '@/components/ui/text';
import { clearTokens } from '@/lib/authStorage';
import { useAuthContext } from '@/lib/authContextProvider';
import { normalizeMediaFile } from '@/lib/mediaFile';
import { THEME } from '@/lib/theme';
import { UserServiceClient } from '@/services/userService';
import type AppUser from '@/models/user';

// Lets the Modal finish its slide-out before the system picker opens.
const SHEET_CLOSE_DELAY_MS = 350;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ProfileField = 'email' | 'phone' | 'nationalId' | 'passportNumber' | 'address' | 'city';
type ProfileForm = Record<ProfileField, string>;

const PROFILE_FIELDS: { key: ProfileField; labelKey: string; inputProps?: TextInputProps }[] = [
  { key: 'email', labelKey: 'profile.fields.emailRequired', inputProps: { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false } },
  { key: 'phone', labelKey: 'profile.fields.phone', inputProps: { keyboardType: 'phone-pad' } },
  { key: 'nationalId', labelKey: 'profile.fields.nationalId', inputProps: { autoCapitalize: 'characters', autoCorrect: false } },
  { key: 'passportNumber', labelKey: 'profile.fields.passportNumber', inputProps: { autoCapitalize: 'characters', autoCorrect: false } },
  { key: 'address', labelKey: 'profile.fields.address' },
  { key: 'city', labelKey: 'profile.fields.city' },
];

const toProfileForm = (source?: AppUser | null): ProfileForm => ({
  email: source?.email ?? '',
  phone: source?.phone ?? '',
  nationalId: source?.nationalId ?? '',
  passportNumber: source?.passportNumber ?? '',
  address: source?.address ?? '',
  city: source?.city ?? '',
});

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const { authUser, setAuthUser } = useAuthContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isSourceSheetVisible, setIsSourceSheetVisible] = useState(false);
  const [isPasswordSheetVisible, setIsPasswordSheetVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(() => toProfileForm(authUser));
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const formOffsetY = useRef(0);
  const fieldOffsetsY = useRef<Partial<Record<ProfileField, number>>>({});

  const userService = useMemo(() => new UserServiceClient(), []);
  const displayName = authUser?.displayName || authUser?.userName || t('profile.user');

  // Refresh stored profile values so the form reflects the latest data from the API.
  useEffect(() => {
    const userId = authUser?.id;
    if (!userId) {
      return;
    }

    let isActive = true;
    userService
      .getMe()
      .then((latest) => {
        if (!isActive) {
          return;
        }
        setProfileForm(toProfileForm(latest));
        setAuthUser({ ...authUser, ...latest, token: authUser?.token });
      })
      .catch((error) => console.error('Failed to load profile', error));

    return () => {
      isActive = false;
    };
    // Runs once per signed-in user. authUser is excluded so the refresh does not loop after setAuthUser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  const updateProfileField = (field: ProfileField, value: string) => {
    setProfileForm((previous) => ({ ...previous, [field]: value }));
  };

  const scrollToField = (field: ProfileField) => {
    const y = formOffsetY.current + (fieldOffsetsY.current[field] ?? 0);
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  };

  const handleUpdateInfo = async () => {
    if (!authUser?.id) {
      SnackBar.Error(t('profile.messages.unableIdentifyUser'));
      return;
    }

    const email = profileForm.email.trim();
    if (!email) {
      SnackBar.Error(t('profile.messages.emailRequired'));
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      SnackBar.Error(t('profile.messages.invalidEmail'));
      return;
    }

    try {
      setIsUpdatingInfo(true);
      const updatedUser = await userService.updateProfile(authUser.id, {
        email,
        phone: profileForm.phone.trim(),
        nationalId: profileForm.nationalId.trim(),
        passportNumber: profileForm.passportNumber.trim(),
        address: profileForm.address.trim(),
        city: profileForm.city.trim(),
      });
      setAuthUser({ ...authUser, ...updatedUser, token: authUser.token });
      setProfileForm(toProfileForm(updatedUser));
      SnackBar.Success(t('profile.messages.updated'));
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('profile.messages.unableUpdate'));
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const pickFromSheet = (source: 'library' | 'camera') => {
    setIsSourceSheetVisible(false);
    setTimeout(() => handlePickProfileImage(source), SHEET_CLOSE_DELAY_MS);
  };

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
            mediaTypes: ['images'],
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
            mediaTypes: ['images'],
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

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closePasswordSheet = () => {
    if (isChangingPassword) {
      return;
    }
    setIsPasswordSheetVisible(false);
    resetPasswordForm();
  };

  const handleChangePassword = async () => {
    if (!authUser?.id) {
      SnackBar.Error(t('profile.messages.unableIdentifyUser'));
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      SnackBar.Error(t('profile.messages.completePasswordFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      SnackBar.Error(t('profile.messages.passwordMismatch'));
      return;
    }

    try {
      setIsChangingPassword(true);
      await userService.changePassword(authUser.id, { currentPassword, newPassword });
      SnackBar.Success(t('profile.messages.passwordChanged'));
      setIsPasswordSheetVisible(false);
      resetPasswordForm();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('profile.messages.unableChangePassword'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.container}>
      <View className="bg-background border-b-separator" style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Icon className="text-foreground" as={ChevronLeft} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('profile.title')}</Text>
        <Button variant="destructive" style={styles.signOutButton} onPress={handleSignOut}>
          <Text>{t('profile.signOut')}</Text>
        </Button>
      </View>

      <KeyboardAvoidingView style={styles.scrollKeyboardAvoidingView} behavior="padding">
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity
              onPress={() => setIsSourceSheetVisible(true)}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <Avatar alt={displayName} style={[styles.avatar, { borderColor: theme.border }]}>
                {authUser?.profilePictureUrl ? (
                  <AvatarImage source={{ uri: authUser.profilePictureUrl }} style={styles.avatarImage} />
                ) : null}
                <AvatarFallback style={[styles.avatarFallback, { backgroundColor: theme.muted }]}>
                  <Icon as={User} className="text-icon" size={56} />
                </AvatarFallback>
              </Avatar>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={[styles.email, { color: theme.mutedForeground }]}>{authUser?.email ?? t('profile.noEmail')}</Text>
          </View>
        </View>

        <View
          style={styles.formSection}
          onLayout={(event) => {
            formOffsetY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>{t('profile.updateInfo')}</Text>
          {PROFILE_FIELDS.map(({ key, labelKey, inputProps }) => (
            <View
              key={key}
              style={styles.fieldGroup}
              onLayout={(event) => {
                fieldOffsetsY.current[key] = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.fieldLabel}>{t(labelKey)}</Text>
              <Input
                value={profileForm[key]}
                onChangeText={(text) => updateProfileField(key, text)}
                onFocus={() => scrollToField(key)}
                editable={!isUpdatingInfo}
                {...inputProps}
              />
            </View>
          ))}
          <Button style={styles.actionButton} onPress={handleUpdateInfo} disabled={isUpdatingInfo}>
            <Text>{isUpdatingInfo ? t('profile.saving') : t('profile.saveInfo')}</Text>
          </Button>
        </View>

        <Button variant="outline" style={styles.actionButton} onPress={() => setIsPasswordSheetVisible(true)}>
          <Text>{t('profile.changePassword')}</Text>
        </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={isSourceSheetVisible}
        animationType="slide"
        onRequestClose={() => setIsSourceSheetVisible(false)}
      >
        <View style={[styles.sheetOverlay, { backgroundColor: theme.overlay }]}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setIsSourceSheetVisible(false)} />
          <View className="bg-background" style={styles.sheet}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Button
              variant="outline"
              style={styles.sheetButton}
              disabled={isUploading}
              onPress={() => pickFromSheet('library')}
            >
              <Text>{t('profile.chooseFromGallery')}</Text>
            </Button>
            <Button
              variant="outline"
              style={styles.sheetButton}
              disabled={isUploading}
              onPress={() => pickFromSheet('camera')}
            >
              <Text>{t('profile.useCamera')}</Text>
            </Button>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isPasswordSheetVisible}
        animationType="slide"
        onRequestClose={closePasswordSheet}
      >
        <KeyboardAvoidingView style={[styles.sheetOverlay, { backgroundColor: theme.overlay }]} behavior="padding">
          <Pressable style={styles.sheetBackdrop} onPress={closePasswordSheet} />
          <View className="bg-background" style={styles.sheet}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={styles.sheetTitle}>{t('profile.changePassword')}</Text>

            <Text style={styles.fieldLabel}>{t('profile.currentPassword')}</Text>
            <Input
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isChangingPassword}
            />

            <Text style={styles.fieldLabel}>{t('profile.newPassword')}</Text>
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isChangingPassword}
            />

            <Text style={styles.fieldLabel}>{t('profile.confirmNewPassword')}</Text>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isChangingPassword}
            />

            <View style={styles.passwordActions}>
              <Button
                variant="outline"
                style={styles.passwordActionButton}
                onPress={closePasswordSheet}
                disabled={isChangingPassword}
              >
                <Text>{t('profile.cancel')}</Text>
              </Button>
              <Button
                style={styles.passwordActionButton}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text>{isChangingPassword ? t('profile.changing') : t('profile.change')}</Text>
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  scrollKeyboardAvoidingView: {
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
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarFallback: {
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
    marginTop: 4,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  sheetButton: {
    width: '100%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  passwordActionButton: {
    flex: 1,
  },
  actionButton: {
    width: '100%',
  },
  formSection: {
    width: '100%',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  signOutButton: {
    alignSelf: 'flex-start',
  },
});
