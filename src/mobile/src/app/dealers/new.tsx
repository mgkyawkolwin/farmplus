'use client';

import * as React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Pressable, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { ChevronLeft, Image as ImageIcon, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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

export default function NewDealerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
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
      SnackBar.Error('Permission to access photos is required.');
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
    if (!formData.dealerName.trim()) {
      SnackBar.Error('Dealer name is required.');
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

      SnackBar.Success('Dealer created successfully.');
      router.back();
    } catch (error: any) {
      SnackBar.Error(error?.message || 'Unable to create dealer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar
        className="bg-background"
        barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'}
      />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          New Dealer
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
        className="bg-background"
      >
        <View style={styles.logoSection}>
          <Pressable onPress={pickLogo} disabled={loading}>
            {logoImage ? (
              <Image source={{ uri: logoImage }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Icon className="text-muted-foreground" as={ImageIcon} size={28} />
              </View>
            )}
          </Pressable>

          {logoImage ? (
            <Button variant="ghost" onPress={removeLogo} style={styles.removeButton}>
              <Text className="text-destructive">Remove logo</Text>
            </Button>
          ) : null}
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">
            Dealer Name <Text className="text-red-500">*</Text>
          </Label>
          <Input
            placeholder="Enter dealer name"
            value={formData.dealerName}
            onChangeText={(value) => handleFieldChange('dealerName', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Email</Label>
          <Input
            placeholder="Enter email address"
            value={formData.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            className="mt-2"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Phone</Label>
          <Input
            placeholder="Enter phone number"
            value={formData.phoneNumber}
            onChangeText={(value) => handleFieldChange('phoneNumber', value)}
            className="mt-2"
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Address</Label>
          <Input
            placeholder="Enter address"
            value={formData.address}
            onChangeText={(value) => handleFieldChange('address', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">State / Division</Label>
          <Input
            placeholder="Enter state or division"
            value={formData.stateDivision}
            onChangeText={(value) => handleFieldChange('stateDivision', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">City</Label>
          <Input
            placeholder="Enter city"
            value={formData.city}
            onChangeText={(value) => handleFieldChange('city', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Country</Label>
          <Input
            placeholder="Enter country"
            value={formData.country}
            onChangeText={(value) => handleFieldChange('country', value)}
            className="mt-2"
            editable={!loading}
          />
        </View>

        <View style={styles.switchRow}>
          <Text className="text-foreground" style={styles.switchLabel}>Active Dealer</Text>
          <Button
            variant={formData.isActive ? 'default' : 'outline'}
            size="sm"
            onPress={() => handleFieldChange('isActive', !formData.isActive)}
            disabled={loading}
          >
            <Text className={formData.isActive ? 'text-primary-foreground' : 'text-foreground'}>{formData.isActive ? 'Active' : 'Inactive'}</Text>
          </Button>
        </View>

        <View style={styles.actionRow}>
          <Button variant="outline" style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
            <Text className="text-foreground">Cancel</Text>
          </Button>
          <Button style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-background font-semibold">Create Dealer</Text>
            )}
          </Button>
        </View>
      </KeyboardAwareScrollView>
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
  contentContainer: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
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
