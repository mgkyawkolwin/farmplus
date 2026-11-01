'use client';

import * as React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { ChevronLeft, Image as ImageIcon, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { DealerServiceClient } from '@/services/dealerService';
import { normalizeMediaFile } from '@/lib/mediaFile';
import SnackBar from '@/components/ui/snack-bar';
import UnauthorizedView from '@/components/unauthorized-view';
import { usePagePermission } from '@/lib/usePagePermission';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

export default function NewDealerScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/dealers/new');
  const service = React.useMemo(() => new DealerServiceClient(), []);

  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    dealerName: '',
    email: '',
    phoneNumber: '',
    address: '',
    stateDivision: '',
    city: '',
    country: '',
    isActive: true,
  });
  const [logoImage, setLogoImage] = React.useState<string | null>(null);
  const [logoFile, setLogoFile] = React.useState<{ uri: string; name: string; type: string } | null>(null);

  const handleFieldChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== ImagePicker.PermissionStatus.GRANTED) {
      SnackBar.Error(t('dealers.messages.photosPermission'));
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) {
      return;
    }

    const asset = pickerResult.assets[0];
    const normalizedFile = normalizeMediaFile({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      assetType: asset.type,
      fallbackName: 'dealer-logo',
    });

    setLogoImage(asset.uri);
    setLogoFile(normalizedFile);
  };

  const removeLogo = () => {
    setLogoImage(null);
    setLogoFile(null);
  };

  const handleSubmit = async () => {
    if (permissionState !== 'authorized') return;
    if (!formData.dealerName.trim()) {
      SnackBar.Error(t('dealers.messages.dealerNameRequired'));
      return;
    }

    try {
      setLoading(true);
      const createdDealer = await service.createDealer({
        dealerName: formData.dealerName.trim(),
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        stateDivision: formData.stateDivision.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        isActive: formData.isActive,
      });

      if (logoFile && createdDealer.id) {
        await service.uploadDealerLogo(createdDealer.id, logoFile);
      }

      SnackBar.Success(t('dealers.messages.createSuccess'));
      router.back();
    } catch (error: any) {
      SnackBar.Error(error?.message || t('dealers.messages.unableSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          {t('dealers.newDealer')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.permissionState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground">{t('dealers.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('dealers.unauthorized.title')} message={t('dealers.unauthorized.description')} />
      ) : <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
        className="bg-background"
      >
        <View style={styles.logoSection}>
          <Pressable onPress={pickLogo} disabled={loading}>
            {logoImage ? (
              <Image source={{ uri: logoImage }} style={[styles.logoImage, { borderColor: theme.border }]} />
            ) : (
              <View style={[styles.logoPlaceholder, { borderColor: theme.border, backgroundColor: theme.muted }]}>
                <Icon className="text-muted-foreground" as={ImageIcon} size={28} />
              </View>
            )}
          </Pressable>

          {logoImage ? (
            <Button variant="ghost" onPress={removeLogo} style={styles.removeButton}>
              <Text className="text-destructive">{t('dealers.actions.removeLogo')}</Text>
            </Button>
          ) : null}
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">
            {t('dealers.fields.dealerName')} <Text style={{ color: theme.destructive }}>*</Text>
          </Label>
          <Input
            placeholder={t('dealers.placeholders.dealerName')}
            value={formData.dealerName}
            onChangeText={(value) => handleFieldChange('dealerName', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">{t('dealers.fields.email')}</Label>
          <Input
            placeholder={t('dealers.placeholders.emailAddress')}
            value={formData.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            className="mt-2"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">{t('dealers.fields.phone')}</Label>
          <Input
            placeholder={t('dealers.placeholders.phone')}
            value={formData.phoneNumber}
            onChangeText={(value) => handleFieldChange('phoneNumber', value)}
            className="mt-2"
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">{t('dealers.fields.address')}</Label>
          <Input
            placeholder={t('dealers.placeholders.address')}
            value={formData.address}
            onChangeText={(value) => handleFieldChange('address', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">{t('dealers.fields.stateDivision')}</Label>
          <Input
            placeholder={t('dealers.placeholders.stateDivision')}
            value={formData.stateDivision}
            onChangeText={(value) => handleFieldChange('stateDivision', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">{t('dealers.fields.city')}</Label>
          <Input
            placeholder={t('dealers.placeholders.city')}
            value={formData.city}
            onChangeText={(value) => handleFieldChange('city', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">{t('dealers.fields.country')}</Label>
          <Input
            placeholder={t('dealers.placeholders.country')}
            value={formData.country}
            onChangeText={(value) => handleFieldChange('country', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.switchRow}>
          <Text className="text-foreground" style={styles.switchLabel}>{t('dealers.fields.activeDealer')}</Text>
          <Button
            variant={formData.isActive ? 'default' : 'outline'}
            size="sm"
            onPress={() => handleFieldChange('isActive', !formData.isActive)}
            disabled={loading}
          >
            <Text className={formData.isActive ? 'text-primary-foreground' : 'text-foreground'}>{formData.isActive ? t('dealers.status.active') : t('dealers.status.inactive')}</Text>
          </Button>
        </View>

        <View style={styles.actionRow}>
          <Button variant="outline" style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
            <Text className="text-foreground">{t('dealers.actions.cancel')}</Text>
          </Button>
          <Button style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.primaryForeground} size="small" />
            ) : (
              <Text className="font-semibold" style={{ color: theme.primaryForeground }}>{t('dealers.actions.createDealer')}</Text>
            )}
          </Button>
        </View>
      </KeyboardAwareScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  permissionState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  contentContainer: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: { marginTop: 8 },
  field: { marginBottom: 20 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelButton: { flex: 1 },
  submitButton: { flex: 1 },
});
