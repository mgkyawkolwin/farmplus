'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Checkbox } from '@/components/ui/checkbox';
import { ICustomerService } from '@/services/customerService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import LoadingOverlay from '@/components/loadingOverlay';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);

type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  nationalIdNumber: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  rowVersion: string;
};

const emptyFormState: CustomerFormState = {
  name: '',
  phone: '',
  email: '',
  nationalIdNumber: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  rowVersion: '',
};

export default function EditCustomerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [isActive, setIsActive] = React.useState(true);
  const [formData, setFormData] = React.useState<CustomerFormState>(emptyFormState);

  React.useEffect(() => {
    if (!customerId) {
      router.back();
      return;
    }

    let isActiveRequest = true;

    const loadCustomer = async () => {
      setPageLoading(true);
      try {
        const customer = await customerService.getCustomerById(customerId);
        if (!isActiveRequest) return;

        setFormData({
          name: customer.name ?? '',
          phone: customer.phone ?? '',
          email: customer.email ?? '',
          nationalIdNumber: customer.nationalIdNumber ?? '',
          address: customer.address ?? '',
          city: customer.city ?? '',
          country: customer.country ?? '',
          postalCode: customer.postalCode ?? '',
          rowVersion: customer.rowVersion ?? '',
        });
        setIsActive(customer.isActive ?? true);
      } catch (error) {
        if (isActiveRequest) {
          SnackBar.Error('Failed to load customer details');
          router.back();
        }
      } finally {
        if (isActiveRequest) {
          setPageLoading(false);
        }
      }
    };

    loadCustomer();

    return () => {
      isActiveRequest = false;
    };
  }, [customerId, router]);

  const handleInputChange = (field: keyof CustomerFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!customerId) return;

    if (!formData.name.trim()) {
      SnackBar.Error('Name is required');
      return;
    }

    try {
      setLoading(true);

      const updateRequest = {
        id: customerId,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        nationalIdNumber: formData.nationalIdNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        rowVersion: formData.rowVersion,
        isActive,
      };

      await customerService.updateCustomer(updateRequest);
      SnackBar.Success('Customer updated successfully');
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        SnackBar.Error(`Failed to update customer: ${error.message}`);
      } else {
        SnackBar.Error('Failed to update customer. Please try again.');
      }
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
      <LoadingOverlay isLoading={loading || pageLoading} />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerBarTitle}>
          Edit Customer
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading customer details...
          </Text>
        </View>
      ) : (
        <KeyboardAwareScrollView contentContainerStyle={styles.content} className="bg-background">
          <View style={styles.field}>
            <Label className="text-foreground">
              Name <Text className="text-red-500">*</Text>
            </Label>
            <Input
              placeholder="Enter customer name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              className="mt-2"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Phone</Label>
            <Input
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              className="mt-2"
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Email</Label>
            <Input
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              className="mt-2"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">National ID Number</Label>
            <Input
              placeholder="Enter national ID number"
              value={formData.nationalIdNumber}
              onChangeText={(value) => handleInputChange('nationalIdNumber', value)}
              className="mt-2"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Address</Label>
            <Input
              placeholder="Enter street address"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              className="mt-2"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">City</Label>
            <Input
              placeholder="Enter city"
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              className="mt-2"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Country</Label>
            <Input
              placeholder="Enter country"
              value={formData.country}
              onChangeText={(value) => handleInputChange('country', value)}
              className="mt-2"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Postal Code</Label>
            <Input
              placeholder="Enter postal code"
              value={formData.postalCode}
              onChangeText={(value) => handleInputChange('postalCode', value)}
              className="mt-2"
              editable={!loading}
            />
          </View>

          <View style={styles.checkboxField}>
            <Checkbox checked={isActive} onCheckedChange={setIsActive} disabled={loading} />
            <Text className="text-foreground ml-2">Active Customer</Text>
          </View>

          <View style={styles.actionRow}>
            <Button className="border border-foreground" variant="outline" style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
              <Text className="text-foreground">Cancel</Text>
            </Button>
            <Button className="bg-foreground" style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-background font-semibold">Update Customer</Text>
              )}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerBarTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    minWidth: 40,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 20,
  },
  checkboxField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});
