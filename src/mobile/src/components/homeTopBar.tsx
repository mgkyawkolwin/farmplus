'use client';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    View,
    useColorScheme,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from './ui/button';
import { Bell, Check, ChevronDown, Menu, Settings, Store, User, X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import SnackBar from '@/components/ui/snack-bar';
import { Shop } from '@/models/shop';
import { ShopServiceClient } from '@/services/shopService';
import { clearSelectedShopId, getSelectedShopId, storeSelectedShopId } from '@/lib/authStorage';
import { notifySelectedShopChanged } from '@/lib/selectedShop';

const shopService = new ShopServiceClient();

export default function HomeTopBar() {
    const router = useRouter();
    const colorScheme = useColorScheme();

    const [shops, setShops] = React.useState<Shop[]>([]);
    const [selectedShopId, setSelectedShopId] = React.useState<string | null>(null);
    const [pickerVisible, setPickerVisible] = React.useState(false);
    const [loadingShops, setLoadingShops] = React.useState(false);

    const loadShops = React.useCallback(async (showError = false) => {
        setLoadingShops(true);
        try {
            const [result, storedId] = await Promise.all([
                shopService.getShops(1, 200),
                getSelectedShopId(),
            ]);
            setShops(result);

            if (storedId && result.some((shop) => shop.id === storedId)) {
                setSelectedShopId(storedId);
            } else if (result.length === 1) {
                setSelectedShopId(result[0].id);
                await storeSelectedShopId(result[0].id);
                notifySelectedShopChanged();
            } else {
                setSelectedShopId(null);
                if (storedId) {
                    await clearSelectedShopId();
                    notifySelectedShopChanged();
                }
            }
        } catch (error) {
            if (showError) {
                SnackBar.Error(error instanceof Error ? error.message : 'Unable to load shops');
            }
        } finally {
            setLoadingShops(false);
        }
    }, []);

    React.useEffect(() => {
        void loadShops(false);
    }, [loadShops]);

    const openPicker = () => {
        setPickerVisible(true);
        void loadShops(true);
    };

    const selectShop = async (shop: Shop) => {
        setSelectedShopId(shop.id);
        setPickerVisible(false);
        try {
            await storeSelectedShopId(shop.id);
            notifySelectedShopChanged();
        } catch {
            SnackBar.Error('Unable to save the selected shop');
        }
    };

    const selectedShop = shops.find((shop) => shop.id === selectedShopId);

    return (
        <View className='bg-tab' style={styles.container}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <View className="bg-red border-border" style={styles.headerBar}>
                <View style={styles.leftSection}>
                    <Button variant="ghost" onPress={() => router.push('/profile')} style={styles.iconButton}>
                        <Icon className="text-foreground" as={User} size={22} />
                    </Button>
                    <Button variant="ghost" onPress={() => router.push('/menu')} style={styles.iconButton}>
                        <Icon className="text-foreground" as={Menu} size={22} />
                    </Button>

                    <Pressable
                        onPress={openPicker}
                        style={styles.selectTrigger}
                        accessibilityRole="button"
                        accessibilityLabel="Choose shop"
                    >
                        <Store size={15} color="#475569" />
                        <Text style={[styles.selectText, !selectedShop && styles.selectPlaceholder]} numberOfLines={1}>
                            {selectedShop ? selectedShop.name : 'Select shop'}
                        </Text>
                        <ChevronDown size={16} color="#475569" />
                    </Pressable>
                </View>
                <View style={styles.rightSection}>
                    <Icon className="text-foreground" as={Bell} size={22} />

                    <Button variant="ghost" onPress={() => router.push('/settings')} style={styles.iconButton}>
                        <Icon className="text-foreground" as={Settings} size={22} />
                    </Button>
                </View>
            </View>

            <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
                    <View className="bg-background" style={styles.sheet}>
                        <View style={styles.sheetHeader}>
                            <Text className="text-foreground" style={styles.sheetTitle}>Select Shop</Text>
                            <Pressable onPress={() => setPickerVisible(false)} hitSlop={8} accessibilityLabel="Close">
                                <X size={20} color="#475569" />
                            </Pressable>
                        </View>

                        {loadingShops && shops.length === 0 ? (
                            <View style={styles.stateBox}>
                                <ActivityIndicator size="small" color="#16794B" />
                                <Text className="text-muted-foreground" style={styles.stateText}>Loading shops...</Text>
                            </View>
                        ) : shops.length === 0 ? (
                            <View style={styles.stateBox}>
                                <Text className="text-foreground" style={styles.stateTitle}>No shops yet</Text>
                                <Text className="text-muted-foreground" style={styles.stateText}>Add a shop to start choosing one here.</Text>
                                <Button
                                    onPress={() => {
                                        setPickerVisible(false);
                                        router.push('/shops/shops' as Parameters<typeof router.push>[0]);
                                    }}
                                    style={styles.manageButton}
                                >
                                    <Text style={styles.manageButtonText}>Manage Shops</Text>
                                </Button>
                            </View>
                        ) : (
                            <ScrollView contentContainerStyle={styles.list}>
                                {shops.map((shop) => {
                                    const selected = shop.id === selectedShopId;
                                    const location = [shop.city, shop.stateDivision].filter(Boolean).join(' · ');
                                    return (
                                        <Pressable
                                            key={shop.id}
                                            onPress={() => void selectShop(shop)}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected }}
                                        >
                                            <View style={[styles.option, selected && styles.optionSelected]}>
                                                <View style={[styles.tile, selected && styles.tileSelected]}>
                                                    <Store size={16} color={selected ? '#FFFFFF' : '#16794B'} />
                                                </View>
                                                <View style={styles.optionInfo}>
                                                    <Text className="text-foreground" style={styles.optionName} numberOfLines={1}>{shop.name}</Text>
                                                    {location ? (
                                                        <Text className="text-muted-foreground" style={styles.optionMeta} numberOfLines={1}>{location}</Text>
                                                    ) : null}
                                                </View>
                                                {selected ? <Check size={18} color="#16794B" /> : null}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 52,
        maxHeight: 52,
        marginBottom: 8,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        width: '100%',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    iconButton: {
        maxWidth: 30,
        width: 20,
        padding: 0,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        alignContent: 'flex-end',
        gap: 8,
    },
    selectTrigger: {
        flex: 1,
        minWidth: 120,
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
    },
    selectText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
    },
    selectPlaceholder: {
        color: '#94A3B8',
        fontWeight: '500',
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.38)',
    },
    sheet: {
        maxHeight: '70%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingTop: 16,
        paddingBottom: 24,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#CBD5E1',
    },
    sheetTitle: {
        fontSize: 15,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    list: {
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    option: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E8F0',
    },
    optionSelected: {
        backgroundColor: '#F0F9F4',
    },
    tile: {
        width: 34,
        height: 34,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E6F4EC',
    },
    tileSelected: {
        backgroundColor: '#16794B',
    },
    optionInfo: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    optionName: {
        fontSize: 14,
        fontWeight: '700',
    },
    optionMeta: {
        fontSize: 11,
    },
    stateBox: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
        gap: 8,
    },
    stateTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    stateText: {
        textAlign: 'center',
    },
    manageButton: {
        marginTop: 8,
        borderRadius: 6,
        backgroundColor: '#16794B',
    },
    manageButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
});
