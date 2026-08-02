'use client';

import * as React from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    View,
    useColorScheme,
    ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

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

export default function NewCustomerScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const [loading, setLoading] = React.useState(false);
    const [isActive, setIsActive] = React.useState(true);

    const [formData, setFormData] = React.useState({
        name: '',
        phone: '',
        email: '',
        nationalIdNumber: '',
        address: '',
        city: '',
        country: '',
        postalCode: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            SnackBar.Error('Name is required');
            return;
        }

        try {
            setLoading(true);

            const createRequest = {
                name: formData.name.trim(),
                phone: formData.phone.trim() || undefined,
                email: formData.email.trim() || undefined,
                nationalIdNumber: formData.nationalIdNumber.trim() || undefined,
                address: formData.address.trim() || undefined,
                city: formData.city.trim() || undefined,
                country: formData.country.trim() || undefined,
                postalCode: formData.postalCode.trim() || undefined,
                isActive,
            };

            await customerService.createCustomer(createRequest);
            SnackBar.Success('Customer created successfully');
            router.back();
        } catch (error) {
            if (error instanceof Error) {
                SnackBar.Error(`Failed to create customer: ${error.message}`);
            } else {
                SnackBar.Error('Failed to create customer. Please try again.');
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
            <LoadingOverlay isLoading={loading} />

            {/* Header with Back Button */}
            <View className="bg-background border-b border-border" style={styles.headerBar}>
                <Button
                    variant="ghost"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Icon className="text-foreground" as={ChevronLeft} size={22} />
                </Button>
                <Text className="text-foreground" style={styles.headerBarTitle}>
                    New Customer
                </Text>
                <View></View>
            </View>

            <KeyboardAwareScrollView
                contentContainerStyle={styles.content}
                className="bg-background"
            >

                {/* Name Field */}
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

                {/* Phone Field */}
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

                {/* Email Field */}
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

                {/* National ID Number Field */}
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

                {/* Address Field */}
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

                {/* City Field */}
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

                {/* Country Field */}
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

                {/* Postal Code Field */}
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

                {/* Is Active Checkbox */}
                <View style={styles.checkboxField}>
                    <Checkbox
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={loading}
                    />
                    <Text className="text-foreground ml-2">Active Customer</Text>
                </View>

                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <Button
                        className="border border-foreground"
                        variant="outline"
                        style={styles.cancelButton}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text className="text-foreground">Cancel</Text>
                    </Button>
                    <Button
                        className="bg-foreground"
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text className="text-background font-semibold">Create Customer</Text>
                        )}
                    </Button>
                </View>
            </KeyboardAwareScrollView>
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
    backButtonText: {
        marginLeft: 4,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingBottom: 40,
    },
    header: {
        textAlign: 'left',
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 24,
        fontSize: 14,
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
    submitButton: {
        flex: 1,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
    },
});
