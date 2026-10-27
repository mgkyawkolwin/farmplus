"use client";

import * as React from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { ChevronLeft, Image as ImageIcon } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import LoadingOverlay from "@/components/loadingOverlay";
import { normalizeMediaFile } from "@/lib/mediaFile";
import { DealerItem } from "@/models/dealer";
import { DealerServiceClient } from "@/services/dealerService";
import SnackBar from "@/components/ui/snack-bar";
import UnauthorizedView from "@/components/unauthorized-view";
import { usePagePermission } from "@/lib/usePagePermission";

type DealerFormState = {
  dealerName: string;
  email: string;
  phoneNumber: string;
  address: string;
  stateDivision: string;
  city: string;
  country: string;
  rowVersion: string;
};

const emptyFormState: DealerFormState = {
  dealerName: "",
  email: "",
  phoneNumber: "",
  address: "",
  stateDivision: "",
  city: "",
  country: "",
  rowVersion: "",
};

export default function EditDealerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const permissionState = usePagePermission('/dealers/edit');
  const dealerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const service = React.useMemo(() => new DealerServiceClient(), []);

  const [saving, setSaving] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [isActive, setIsActive] = React.useState(true);
  const [logoUri, setLogoUri] = React.useState<string | null>(null);
  const [logoFile, setLogoFile] = React.useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [clearLogo, setClearLogo] = React.useState(false);
  const [formData, setFormData] =
    React.useState<DealerFormState>(emptyFormState);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    if (!dealerId) {
      router.back();
      return;
    }

    let active = true;
    const loadDealer = async () => {
      setPageLoading(true);
      try {
        const dealer = await service.getDealerById(dealerId);
        if (!active) return;

        setFormData({
          dealerName: dealer.dealerName ?? "",
          email: dealer.email ?? "",
          phoneNumber: dealer.phoneNumber ?? "",
          address: dealer.address ?? "",
          stateDivision: dealer.stateDivision ?? "",
          city: dealer.city ?? "",
          country: dealer.country ?? "",
          rowVersion: dealer.rowVersion ?? "",
        });
        setLogoUri(dealer.logoUrl ?? null);
        setIsActive(dealer.isActive);
      } catch (error) {
        if (active) {
          SnackBar.Error("Failed to load dealer details.");
          router.back();
        }
      } finally {
        if (active) setPageLoading(false);
      }
    };

    void loadDealer();
    return () => {
      active = false;
    };
  }, [dealerId, permissionState, router, service]);

  const updateField = (field: keyof DealerFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
      SnackBar.Error("Permission to access photos is required.");
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
        fallbackName: "dealer-logo",
      }),
    );
    setClearLogo(false);
  };

  const removeLogo = () => {
    setLogoUri(null);
    setLogoFile(null);
    setClearLogo(true);
  };

  const handleSubmit = async () => {
    if (permissionState !== 'authorized') return;
    if (!dealerId || !formData.dealerName.trim()) {
      SnackBar.Error("Dealer name is required.");
      return;
    }

    try {
      setSaving(true);
      const request: DealerItem = {
        id: dealerId,
        dealerName: formData.dealerName.trim(),
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        stateDivision: formData.stateDivision.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        isActive,
        rowVersion: formData.rowVersion,
        clearLogoUrl: clearLogo || undefined,
      };
      await service.updateDealer(request);

      if (logoFile) {
        await service.uploadDealerLogo(dealerId, logoFile);
      }

      SnackBar.Success("Dealer updated successfully.");
      router.back();
    } catch (error) {
      SnackBar.Error(
        error instanceof Error ? error.message : "Unable to update dealer.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar
        className="bg-background"
        barStyle={colorScheme === "light" ? "light-content" : "dark-content"}
      />
      <LoadingOverlay isLoading={saving || (permissionState === 'authorized' && pageLoading)} />

      <View
        className="bg-background border-b border-border"
        style={styles.headerBar}
      >
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Edit Dealer
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground" style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading dealer details...
          </Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          enableOnAndroid
          extraScrollHeight={40}
          keyboardShouldPersistTaps="handled"
          className="bg-background"
        >
          <View style={styles.logoSection}>
            <Pressable onPress={pickLogo} disabled={saving}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Icon
                    className="text-muted-foreground"
                    as={ImageIcon}
                    size={28}
                  />
                </View>
              )}
            </Pressable>
            {logoUri ? (
              <Button
                variant="ghost"
                onPress={removeLogo}
                style={styles.removeButton}
                disabled={saving}
              >
                <Text className="text-destructive">Remove logo</Text>
              </Button>
            ) : null}
          </View>

          <DealerFields
            formData={formData}
            disabled={saving}
            onChange={updateField}
          />

          <View style={styles.switchRow}>
            <Text className="text-foreground" style={styles.switchLabel}>
              Active Dealer
            </Text>
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              onPress={() => setIsActive((current) => !current)}
              disabled={saving}
            >
              <Text
                className={
                  isActive ? "text-primary-foreground" : "text-foreground"
                }
              >
                {isActive ? "Active" : "Inactive"}
              </Text>
            </Button>
          </View>

          <View style={styles.actionRow}>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text className="text-foreground">Cancel</Text>
            </Button>
            <Button
              style={styles.actionButton}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-background font-semibold">
                  Save Changes
                </Text>
              )}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
}

function DealerFields({
  formData,
  disabled,
  onChange,
}: {
  formData: DealerFormState;
  disabled: boolean;
  onChange: (field: keyof DealerFormState, value: string) => void;
}) {
  const fields: Array<{
    field: Exclude<keyof DealerFormState, "rowVersion">;
    label: string;
    placeholder: string;
    keyboardType?: "default" | "email-address" | "phone-pad";
  }> = [
    {
      field: "dealerName",
      label: "Dealer Name *",
      placeholder: "Enter dealer name",
    },
    {
      field: "email",
      label: "Email",
      placeholder: "Enter email address",
      keyboardType: "email-address",
    },
    {
      field: "phoneNumber",
      label: "Phone",
      placeholder: "Enter phone number",
      keyboardType: "phone-pad",
    },
    { field: "address", label: "Address", placeholder: "Enter address" },
    {
      field: "stateDivision",
      label: "State / Division",
      placeholder: "Enter state or division",
    },
    { field: "city", label: "City", placeholder: "Enter city" },
    { field: "country", label: "Country", placeholder: "Enter country" },
  ];

  return (
    <>
      {fields.map((field) => (
        <View key={field.field} style={styles.field}>
          <Label className="text-foreground">{field.label}</Label>
          <Input
            placeholder={field.placeholder}
            value={formData[field.field]}
            onChangeText={(value) => onChange(field.field, value)}
            className="mt-2"
            keyboardType={field.keyboardType}
            editable={!disabled}
          />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backButton: { minWidth: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: { width: 40 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stateText: { marginTop: 12 },
  logoSection: { alignItems: "center", marginBottom: 24 },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: { marginTop: 8 },
  field: { marginBottom: 20 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  switchLabel: { fontSize: 14, fontWeight: "500" },
  actionRow: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1 },
});
