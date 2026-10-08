'use client';

import * as React from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    View,
    useColorScheme,
    ActivityIndicator,
} from 'react-native';
import { ChevronLeft, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { normalizeMediaFile } from '@/lib/mediaFile';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);

export default function NewCustomerScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const [loading, setLoading] = React.useState(false);
    const [isActive, setIsActive] = React.useState(true);
    const [profileImageUri, setProfileImageUri] = React.useState<string | null>(null);
    const [showPhotoModal, setShowPhotoModal] = React.useState(false);

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

    const handlePickProfileImage = async (source: 'library' | 'camera') => {
        setShowPhotoModal(false);

        const permissionResult = source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== 'granted') {
            return;
        }

        const pickerResult = source === 'camera'
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

        if (!pickerResult.canceled && pickerResult.assets?.[0]) {
            setProfileImageUri(pickerResult.assets[0].uri);
        }
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

            const createdCustomer = await customerService.createCustomer(createRequest);

            if (profileImageUri) {
                const imageFile = normalizeMediaFile({
                    uri: profileImageUri,
                    fileName: profileImageUri.split('/').pop() || undefined,
                    mimeType: undefined,
                    assetType: 'image',
                    fallbackName: 'customer-profile',
                });

                await customerService.uploadCustomerProfilePicture(createdCustomer.id, imageFile);
            }

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

            <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }}
                enableOnAndroid={true}
                extraScrollHeight={40}
                keyboardShouldPersistTaps="handled"
                className="bg-background"
            >
                <View style={styles.photoSection}>
                    <Pressable onPress={() => setShowPhotoModal(true)} disabled={loading}>
                        <View style={styles.avatarWrapper}>
                            {profileImageUri ? (
                                <Avatar alt={formData.name || 'Customer'} style={styles.avatar}>
                                    <AvatarImage source={{ uri: profileImageUri }} style={styles.avatarImage} />
                                </Avatar>
                            ) : (
                                <View style={styles.avatarFallback}>
                                    <Icon className="text-muted-foreground" as={User} size={34} />
                                </View>
                            )}
                        </View>
                    </Pressable>
                </View>

                <Modal
                    transparent
                    visible={showPhotoModal}
                    animationType="slide"
                    onRequestClose={() => setShowPhotoModal(false)}
                >
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowPhotoModal(false)}>
                        <Pressable style={styles.modalSheet} onPress={() => undefined}>
                            <View style={styles.sheetHandle} />
                            <Text className="text-foreground" style={styles.sheetTitle}>Choose photo</Text>
                            <Button variant="outline" style={styles.sheetButton} onPress={() => handlePickProfileImage('library')} disabled={loading}>
                                <Text>Choose from gallery</Text>
                            </Button>
                            <Button variant="outline" style={styles.sheetButton} onPress={() => handlePickProfileImage('camera')} disabled={loading}>
                                <Text>Take photo</Text>
                            </Button>
                            <Button variant="ghost" style={styles.sheetButton} onPress={() => setShowPhotoModal(false)}>
                                <Text>Cancel</Text>
                            </Button>
                        </Pressable>
                    </Pressable>
                </Modal>

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
    photoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#F3F4F6',
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 48,
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 28,
    },
    sheetHandle: {
        width: 44,
        height: 5,
        borderRadius: 999,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        marginBottom: 14,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    sheetButton: {
        marginBottom: 10,
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
