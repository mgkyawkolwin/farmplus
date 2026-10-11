import { View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { SupplierForm } from "@/components/suppliers/supplierForm";

export default function EditSupplierScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View
        className="bg-background border-b border-border"
        style={{ flexDirection: "row", alignItems: "center", padding: 6 }}
      >
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={{ minWidth: 40 }}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text
          className="text-foreground"
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          Edit Supplier
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <SupplierForm supplierId={id} />
    </SafeAreaView>
  );
}
