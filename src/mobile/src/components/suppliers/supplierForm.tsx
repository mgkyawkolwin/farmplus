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

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { normalizeMediaFile } from "@/lib/mediaFile";
import { Supplier } from "@/models/supplier";
import { SupplierServiceClient } from "@/services/supplierService";
import SnackBar from "@/components/ui/snack-bar";

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
    if (!supplierId) return;
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
        SnackBar.Error("Failed to load supplier details.");
        router.back();
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [router, service, supplierId]);

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
        fallbackName: "supplier-logo",
      }),
    );
  };

  const submit = async () => {
    if (!fields.supplierName.trim()) {
      SnackBar.Error("Supplier name is required.");
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
        `Supplier ${supplierId ? "updated" : "created"} successfully.`,
      );
      router.back();
    } catch (error) {
      SnackBar.Error(
        error instanceof Error ? error.message : "Unable to save supplier.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  const labels: Array<
    [keyof Fields, string, "default" | "email-address" | "phone-pad"]
  > = [
    ["supplierName", "Supplier Name *", "default"],
    ["email", "Email", "email-address"],
    ["phoneNumber", "Phone", "phone-pad"],
    ["address", "Address", "default"],
    ["stateDivision", "State / Division", "default"],
    ["city", "City", "default"],
    ["country", "Country", "default"],
  ];
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      enableOnAndroid
      extraScrollHeight={40}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <Pressable onPress={pickLogo} disabled={saving}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} />
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
      </View>
      {labels.map(([key, label, keyboardType]) => (
        <View key={key} style={styles.field}>
          <Label className="text-foreground">{label}</Label>
          <Input
            value={fields[key] ?? ""}
            placeholder={`Enter ${label.replace(" *", "").toLowerCase()}`}
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
        <Text className="text-foreground">Active Supplier</Text>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          onPress={() => setIsActive((value) => !value)}
          disabled={saving}
        >
          <Text
            className={isActive ? "text-primary-foreground" : "text-foreground"}
          >
            {isActive ? "Active" : "Inactive"}
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
          <Text className="text-foreground">Cancel</Text>
        </Button>
        <Button style={styles.action} onPress={submit} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-background font-semibold">Save</Text>
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
    backgroundColor: "#F3F4F6",
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
