import * as React from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Image as ImageIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useColorScheme } from 'nativewind';

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { normalizeMediaFile } from "@/lib/mediaFile";
import { Supplier } from "@/models/supplier";
import { SupplierServiceClient } from "@/services/supplierService";
import SnackBar from "@/components/ui/snack-bar";
import UnauthorizedView from "@/components/unauthorized-view";
import { usePagePermission } from "@/lib/usePagePermission";
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

type Fields = Pick<
  Supplier,
  | "supplierName"
  | "email"
  | "phoneNumber"
  | "address"
  | "stateDivision"
  | "city"
  | "country"
>;

const emptyFields: Fields = {
  supplierName: "",
  email: "",
  phoneNumber: "",
  address: "",
  stateDivision: "",
  city: "",
  country: "",
};

export function SupplierForm({ supplierId }: { supplierId?: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission(supplierId ? '/suppliers/edit' : '/suppliers/new');
  const service = React.useMemo(() => new SupplierServiceClient(), []);
  const [fields, setFields] = React.useState<Fields>(emptyFields);
  const [rowVersion, setRowVersion] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [logoUri, setLogoUri] = React.useState<string | undefined>();
  const [logoFile, setLogoFile] = React.useState<{
    uri: string;
    name: string;
    type: string;
  }>();
  const [loading, setLoading] = React.useState(Boolean(supplierId));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!supplierId || permissionState !== 'authorized') return;
    let active = true;
    const load = async () => {
      try {
        const supplier = await service.getSupplierById(supplierId);
        if (!active) return;
        setFields({
          supplierName: supplier.supplierName,
          email: supplier.email ?? "",
          phoneNumber: supplier.phoneNumber ?? "",
          address: supplier.address ?? "",
          stateDivision: supplier.stateDivision ?? "",
          city: supplier.city ?? "",
          country: supplier.country ?? "",
        });
        setRowVersion(supplier.rowVersion ?? "");
        setIsActive(supplier.isActive);
        setLogoUri(supplier.logoUrl);
      } catch {
        SnackBar.Error(t('suppliers.messages.detailsFailed'));
        router.back();
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [permissionState, router, service, supplierId, t]);

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
      SnackBar.Error(t('suppliers.messages.photosPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setLogoUri(asset.uri);
    setLogoFile(
      normalizeMediaFile({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        assetType: asset.type,
        fallbackName: "supplier-logo",
      }),
    );
  };

  const submit = async () => {
    if (permissionState !== 'authorized') return;
    if (!fields.supplierName.trim()) {
      SnackBar.Error(t('suppliers.messages.nameRequired'));
      return;
    }
    try {
      setSaving(true);
      const request = {
        ...fields,
        supplierName: fields.supplierName.trim(),
        email: fields.email?.trim() || undefined,
        phoneNumber: fields.phoneNumber?.trim() || undefined,
        address: fields.address?.trim() || undefined,
        stateDivision: fields.stateDivision?.trim() || undefined,
        city: fields.city?.trim() || undefined,
        country: fields.country?.trim() || undefined,
        isActive,
      };
      const supplier = supplierId
        ? await service.updateSupplier({
            id: supplierId,
            ...request,
            rowVersion,
          })
        : await service.createSupplier(request);
      if (logoFile) await service.uploadSupplierLogo(supplier.id, logoFile);
      SnackBar.Success(
        t(supplierId ? 'suppliers.messages.updated' : 'suppliers.messages.created'),
      );
      router.back();
    } catch (error) {
      SnackBar.Error(
        error instanceof Error ? error.message : t('suppliers.messages.unableSave'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (permissionState === 'checking')
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="text-muted-foreground">{t('suppliers.dashboard.checkingPermission')}</Text>
      </View>
    );
  if (permissionState === 'denied') return <UnauthorizedView title={t('suppliers.unauthorized.title')} message={t('suppliers.unauthorized.description')} />;
  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  const labels: Array<
    [keyof Fields, string, string, "default" | "email-address" | "phone-pad"]
  > = [
    ["supplierName", `${t('suppliers.fields.supplierName')} *`, t('suppliers.placeholders.supplierName'), "default"],
    ["email", t('suppliers.fields.email'), t('suppliers.placeholders.email'), "email-address"],
    ["phoneNumber", t('suppliers.fields.phone'), t('suppliers.placeholders.phone'), "phone-pad"],
    ["address", t('suppliers.fields.address'), t('suppliers.placeholders.address'), "default"],
    ["stateDivision", t('suppliers.fields.stateDivision'), t('suppliers.placeholders.stateDivision'), "default"],
    ["city", t('suppliers.fields.city'), t('suppliers.placeholders.city'), "default"],
    ["country", t('suppliers.fields.country'), t('suppliers.placeholders.country'), "default"],
  ];
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      enableOnAndroid
      extraScrollHeight={40}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <Pressable
          onPress={pickLogo}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t('suppliers.actions.chooseLogo')}
        >
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={[styles.logo, { borderColor: theme.border }]} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: theme.muted }]}>
              <Icon
                className="text-muted-foreground"
                as={ImageIcon}
                size={28}
              />
            </View>
          )}
        </Pressable>
      </View>
      {labels.map(([key, label, placeholder, keyboardType]) => (
        <View key={key} style={styles.field}>
          <Label className="text-foreground">{label}</Label>
          <Input
            value={fields[key] ?? ""}
            placeholder={placeholder}
            keyboardType={keyboardType}
            editable={!saving}
            className="mt-2"
            onChangeText={(value) =>
              setFields((current) => ({ ...current, [key]: value }))
            }
          />
        </View>
      ))}
      <View style={styles.activeRow}>
        <Text className="text-foreground">{t('suppliers.fields.activeSupplier')}</Text>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          style={isActive ? { backgroundColor: theme.primary } : undefined}
          onPress={() => setIsActive((value) => !value)}
          disabled={saving}
        >
          <Text
            style={{ color: isActive ? theme.primaryForeground : theme.foreground }}
          >
            {isActive ? t('suppliers.dashboard.active') : t('suppliers.dashboard.inactive')}
          </Text>
        </Button>
      </View>
      <View style={styles.actions}>
        <Button
          variant="outline"
          style={styles.action}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text className="text-foreground">{t('suppliers.actions.cancel')}</Text>
        </Button>
        <Button style={[styles.action, { backgroundColor: theme.primary }]} onPress={submit} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.primaryForeground} />
          ) : (
            <Text className="font-semibold" style={{ color: theme.primaryForeground }}>{t('suppliers.actions.save')}</Text>
          )}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoSection: { alignItems: "center", marginBottom: 24 },
  logo: { width: 96, height: 96, borderRadius: 24 },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  field: { marginBottom: 20 },
  activeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  actions: { flexDirection: "row", gap: 8 },
  action: { flex: 1 },
});
